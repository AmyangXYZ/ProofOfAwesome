import { io, Socket } from "socket.io-client"
import { sha256 } from "js-sha256"
import { Repository } from "./repository"
import { ClientEvents, ServerEvents, Identity, Message } from "@proof-of-awesome/connect"
import { Wallet } from "./wallet"
import {
  verifyBlock,
  verifyTransaction,
  verifyAchievement,
  verifyReview,
  Block,
  Achievement,
  Review,
  Transaction,
  ChainHead,
  isBlock,
  isTransaction,
  isAchievement,
  isReview,
  isChainHead,
  AwesomeComStatus,
  getAwesomeComStatus,
  chainConfig,
  hashBlockHeader,
  BlockHeader,
  signChainHead,
  verifyChainHead,
  signReview,
  waitForGenesis,
  Account,
} from "./awesome"
import { MerkleTree, SparseMerkleTree } from "./merkle"
import {
  ChainHeadResponse,
  isChainHeadRequest,
  isChainHeadResponse,
  isReviewsResponse,
  isReviewsRequest,
  MESSAGE_TYPE,
  isReviewRequest,
  isAchievementsResponse,
  isReviewResponse,
  isAchievementsRequest,
  isBlockRequest,
  isBlockResponse,
  isBlocksRequest,
  isBlocksResponse,
  isTransactionRequest,
  isTransactionResponse,
  isTransactionsRequest,
  isTransactionsResponse,
  isAchievementRequest,
  isAchievementResponse,
  isAccountRequest,
  AccountResponse,
  isAccountResponse,
} from "./message"
import { Reviewer, ReviewerRequest, ReviewerResult } from "./reviewer"

interface EventMap {
  "awesomecom.status.updated": AwesomeComStatus
  "awesomecom.submission.started": void
  "awesomecom.review.started": void
  "awesomecom.consensus.started": void
  "awesomecom.announcement.started": void
  "account.updated": Account
  "block.added": Block
  "achievement.added": Achievement
  "review.added": Review
  "transaction.added": Transaction
}

export class AwesomeNode {
  private awesomeComStatus: AwesomeComStatus = {
    edition: 0,
    theme: "",
    phase: "Announcement",
    phaseRemaining: 0,
    editionRemaining: 0,
  }
  private socket: Socket<ClientEvents, ServerEvents>
  private wallet: Wallet
  private identity: Identity
  private repository: Repository
  private reviewer: Reviewer
  private account: Account
  private eventListeners: Map<keyof EventMap, Set<unknown>> = new Map()

  // only full nodes maintain the account state
  private accounts: SparseMerkleTree | null = null

  private chainHead: ChainHead | null = null
  // created or received in the submission phase in current edition
  private pendingAchievements: Achievement[] = []
  // created or received in the review phase in current edition
  private pendingReviews: Review[] = []
  // created or received in the consensus phase in current edition
  private candidateBlock: Block | null = null
  // created or received in the announcement phase in current edition
  private newBlock: Block | null = null

  // de-duplication of messages by data hash or signature
  private hasReceived: Map<string, number> = new Map()
  // process response only if requestId exists
  private sentRequests: Map<string, boolean> = new Map()

  // full nodes join TPC automatically and light nodes opt-in
  public inTPC: boolean = false

  private chainHeadBroadcastPeriod: number = 1 * 60 * 1000
  private candidateBlockBroadcastPeriod: number = 30 * 1000
  private newBlockBroadcastPeriod: number = 10 * 1000
  private cleanReceivedMessagesPeriod: number = 30 * 60 * 1000

  private statusUpdateInterval: NodeJS.Timeout | null = null
  private chainHeadBroadcastInterval: NodeJS.Timeout | null = null
  private candidateBlockBroadcastInterval: NodeJS.Timeout | null = null
  private newBlockBroadcastInterval: NodeJS.Timeout | null = null
  private cleanReceivedMessagesInterval: NodeJS.Timeout | null = null

  constructor(
    connectAddress: string,
    name: string,
    nodeType: "light" | "full",
    mnemonic: string,
    passphrase: string,
    repository: Repository,
    reviewer: Reviewer
  ) {
    this.wallet = new Wallet(mnemonic, passphrase)

    this.identity = {
      chainId: chainConfig.chainId,
      name,
      address: this.wallet.derieveAddress(),
      nodeType,
      publicKey: this.wallet.publicKey,
      signature: "",
    }
    this.identity.signature = this.wallet.sign(
      sha256(
        [
          this.identity.chainId,
          this.identity.name,
          this.identity.address,
          this.identity.nodeType,
          this.identity.publicKey,
        ].join("_")
      )
    )
    console.log("Node identity:", this.identity)

    this.account = {
      address: this.identity.address,
      balance: 0,
      nonce: 0,
      acceptedAchievements: 0,
    }
    if (this.identity.nodeType == "full") {
      this.accounts = new SparseMerkleTree()
    }

    this.inTPC = this.identity.nodeType == "full"

    this.repository = repository

    this.reviewer = reviewer

    this.socket = io(connectAddress, { autoConnect: false })
    this.setupSocket()
  }

  public async start() {
    await waitForGenesis()
    await this.repository.init()
    this.socket.connect()

    this.reviewer.onReviewSubmitted((result: ReviewerResult) => {
      console.log("Review result:", result)
      const review: Review = {
        edition: this.awesomeComStatus.edition,
        achievementSignature: result.achievementSignature,
        reviewerName: this.identity.name,
        reviewerAddress: this.identity.address,
        scores: result.scores,
        comment: result.comment,
        timestamp: Date.now(),
        reviewerPublicKey: this.identity.publicKey,
        signature: "",
      }
      review.signature = signReview(review, this.wallet)
      this.pendingReviews.push(review)
    })

    this.on("awesomecom.submission.started", async () => {
      this.newBlock = null
      this.stopNewBlockBroadcast()
      this.pendingAchievements = []
      if (this.inTPC) {
        this.socket.emit("room.join", this.currentTPCRoom())
      }
    })

    this.on("awesomecom.review.started", async () => {
      this.pendingReviews = []
    })

    this.on("awesomecom.consensus.started", async () => {
      this.candidateBlock = null
      if (this.identity.nodeType == "full") {
        this.candidateBlock = await this.createBlock()
        if (this.candidateBlock) {
          this.startCandidateBlockBroadcast()
        } else {
          console.log("failed to create block")
        }
      }
    })

    this.on("awesomecom.announcement.started", async () => {
      if (this.identity.nodeType == "full") {
        this.stopCandidateBlockBroadcast()
        if (this.candidateBlock) {
          this.newBlock = this.candidateBlock
          console.log("new block header:", this.newBlock.header)
          this.candidateBlock = null

          this.chainHead = {
            chainId: chainConfig.chainId,
            latestBlockHeight: this.newBlock.header.height,
            latestBlockHash: this.newBlock.header.hash,
            timestamp: Date.now(),
            nodePublicKey: this.identity.publicKey,
            signature: "",
          }
          this.chainHead.signature = signChainHead(this.chainHead, this.wallet)

          await this.repository.addBlock(this.newBlock)
          this.emit("block.added", this.newBlock)
          this.startNewBlockBroadcast()

          // assign achievement rewards
          if (this.accounts) {
            for (const achievement of this.newBlock.achievements) {
              const { account } = this.accounts.get(achievement.authorAddress)
              if (account) {
                account.balance += chainConfig.rewardRules.acceptedAchievements
                account.acceptedAchievements += 1
                this.accounts.insert(account)
              }
            }
          }
        }
      }
    })

    this.on("block.added", async () => {})

    this.startAwesomeComStatusUpdate()
    if (this.identity.nodeType == "full") {
      this.startChainHeadBroadcast()
    }
    this.startCleanReceivedMessages()
  }

  public async joinTPC() {
    this.inTPC = true
    this.socket.emit("room.join", this.currentTPCRoom())
  }

  public async leaveTPC() {
    this.inTPC = false
    this.socket.emit("room.leave", this.currentTPCRoom())
  }

  public on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }

    this.eventListeners.get(event)!.add(callback as (data: unknown) => void)

    return () => this.off(event, callback)
  }

  public off<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void): void {
    this.eventListeners.get(event)?.delete(callback as (data: unknown) => void)
  }

  protected emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const callbacks = this.eventListeners.get(event)
    if (callbacks) {
      callbacks.forEach((callback) => {
        ;(callback as (data: EventMap[K]) => void)(data)
      })
    }
  }

  private currentTPCRoom() {
    return `${chainConfig.chainId}:awesomecom_${this.awesomeComStatus.edition}_tpc`
  }

  private setupSocket() {
    this.socket.on("connect", () => {
      this.socket.emit("node.connect", this.identity)
    })

    this.socket.on("node.connected", () => {
      console.log("Connected to AwesomeConnect")
      this.socket.emit("room.get_members", `${chainConfig.chainId}:nodes`)
    })

    this.socket.on("message.received", (message: Message) => {
      // if (message.from == this.identity.address) {
      //   return
      // }
      this.handleMessage(message)
    })

    this.socket.on("room.members", async (room: string, members: Identity[]) => {
      console.log(`Room [${room}] members: ${members.length}`)
      if (room === `${chainConfig.chainId}:nodes`) {
        if (members.length > 0) {
          const requestId = crypto.randomUUID()
          const msg: Message = {
            from: this.identity.address,
            to: members[0].address,
            type: MESSAGE_TYPE.CHAIN_HEAD_REQUEST,
            payload: {
              requestId,
            },
            timestamp: Date.now(),
          }
          this.socket.emit("message.send", msg)
          this.sentRequests.set(requestId, true)
        }
      }
    })
  }

  private startAwesomeComStatusUpdate() {
    this.updateAwesomeComStatus()
    this.statusUpdateInterval = setInterval(() => {
      this.updateAwesomeComStatus()
    }, 1000)
  }

  private stopAwesomeComStatusUpdate() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval)
    }
  }

  private updateAwesomeComStatus() {
    const status = getAwesomeComStatus()
    if (status.edition !== this.awesomeComStatus.edition || status.phase !== this.awesomeComStatus.phase) {
      console.log(`[${status.edition}th AwesomeCom (Theme: ${status.theme})] Entering ${status.phase} phase`)
      switch (status.phase) {
        case "Submission":
          this.emit("awesomecom.submission.started", undefined)
          break
        case "Review":
          this.emit("awesomecom.review.started", undefined)
          break
        case "Consensus":
          this.emit("awesomecom.consensus.started", undefined)
          break
        case "Announcement":
          this.emit("awesomecom.announcement.started", undefined)
          break
      }
    }
    this.awesomeComStatus = status
    this.emit("awesomecom.status.updated", status)
  }

  private handleMessage(message: Message) {
    switch (message.type) {
      case MESSAGE_TYPE.CHAIN_HEAD:
        this.handleChainHead(message)
        break
      case MESSAGE_TYPE.NEW_TRANSACTION:
        this.handleNewTransaction(message)
        break
      case MESSAGE_TYPE.CANDIDATE_BLOCK:
        this.handleCandidateBlock(message)
        break
      case MESSAGE_TYPE.NEW_BLOCK:
        this.handleNewBlock(message)
        break
      case MESSAGE_TYPE.NEW_ACHIEVEMENT:
        this.handleNewAchievement(message)
        break
      case MESSAGE_TYPE.NEW_REVIEW:
        this.handleNewReview(message)
        break
      case MESSAGE_TYPE.ACCOUNT_REQUEST:
        this.handleAccountRequest(message)
        break
      case MESSAGE_TYPE.ACCOUNT_RESPONSE:
        this.handleAccountResponse(message)
        break
      case MESSAGE_TYPE.CHAIN_HEAD_REQUEST:
        if (this.identity.nodeType == "full") {
          this.handleChainHeadRequest(message)
        }
        break
      case MESSAGE_TYPE.CHAIN_HEAD_RESPONSE:
        this.handleChainHeadResponse(message)
        break
      case MESSAGE_TYPE.BLOCK_REQUEST:
        this.handleBlockRequest(message)
        break
      case MESSAGE_TYPE.BLOCK_RESPONSE:
        this.handleBlockResponse(message)
        break
      case MESSAGE_TYPE.BLOCKS_REQUEST:
        this.handleBlocksRequest(message)
        break
      case MESSAGE_TYPE.BLOCKS_RESPONSE:
        this.handleBlocksResponse(message)
        break
      case MESSAGE_TYPE.TRANSACTION_REQUEST:
        this.handleTransactionRequest(message)
        break
      case MESSAGE_TYPE.TRANSACTION_RESPONSE:
        this.handleTransactionResponse(message)
        break
      case MESSAGE_TYPE.TRANSACTIONS_REQUEST:
        this.handleTransactionsRequest(message)
        break
      case MESSAGE_TYPE.TRANSACTIONS_RESPONSE:
        this.handleTransactionsResponse(message)
        break
      case MESSAGE_TYPE.ACHIEVEMENT_REQUEST:
        this.handleAchievementRequest(message)
        break
      case MESSAGE_TYPE.ACHIEVEMENT_RESPONSE:
        this.handleAchievementResponse(message)
        break
      case MESSAGE_TYPE.ACHIEVEMENTS_REQUEST:
        this.handleAchievementsRequest(message)
        break
      case MESSAGE_TYPE.ACHIEVEMENTS_RESPONSE:
        this.handleAchievementsResponse(message)
        break
      case MESSAGE_TYPE.REVIEW_REQUEST:
        this.handleReviewRequest(message)
        break
      case MESSAGE_TYPE.REVIEW_RESPONSE:
        this.handleReviewResponse(message)
        break
      case MESSAGE_TYPE.REVIEWS_REQUEST:
        this.handleReviewsRequest(message)
        break
      case MESSAGE_TYPE.REVIEWS_RESPONSE:
        this.handleReviewsResponse(message)
        break
      default:
        console.log("Unknown message type:", message.from, message.type, message.timestamp)
        break
    }
  }

  private async handleChainHead(message: Message) {
    const chainHead = message.payload
    if (!isChainHead(chainHead) || this.hasReceived.has(chainHead.signature) || !verifyChainHead(chainHead)) {
      return
    }

    this.hasReceived.set(chainHead.signature, Date.now())

    console.log("Chain head:", chainHead)
  }

  private async handleCandidateBlock(message: Message) {
    if (this.awesomeComStatus.phase != "Consensus" || this.identity.nodeType != "full") {
      return
    }
    const block = message.payload
    if (!isBlock(block) || this.hasReceived.has(block.header.hash) || !verifyBlock(block)) {
      return
    }
    this.hasReceived.set(block.header.hash, Date.now())

    if (!this.candidateBlock) {
      this.candidateBlock = block
      return
    }

    if (block.header.hash === this.candidateBlock.header.hash) {
      return
    }

    if (
      this.candidateBlock.header.height !== block.header.height ||
      this.candidateBlock.header.previousHash !== block.header.previousHash
    ) {
      return
    }

    const isSameContent =
      this.candidateBlock.header.transactionsRoot === block.header.transactionsRoot &&
      this.candidateBlock.header.achievementsRoot === block.header.achievementsRoot &&
      this.candidateBlock.header.reviewsRoot === block.header.reviewsRoot &&
      this.candidateBlock.header.accountsRoot === block.header.accountsRoot

    if (isSameContent && block.header.timestamp < this.candidateBlock.header.timestamp) {
      this.candidateBlock = block
    }
  }

  private async handleNewBlock(message: Message) {
    if (this.awesomeComStatus.phase != "Announcement" || this.identity.nodeType != "light") {
      return
    }
    const block = message.payload
    if (!isBlock(block) || this.hasReceived.has(block.header.hash) || !verifyBlock(block)) {
      return
    }
    this.hasReceived.set(block.header.hash, Date.now())

    console.log("New block:", block)
    if (this.newBlock == null || block.header.height > this.newBlock.header.height) {
      this.newBlock = block
      await this.repository.addBlock(block)
      this.emit("block.added", block)
    }
  }

  private async handleNewTransaction(message: Message) {
    const transaction = message.payload
    if (!isTransaction(transaction) || this.hasReceived.has(transaction.signature) || !verifyTransaction(transaction)) {
      return
    }
    this.hasReceived.set(transaction.signature, Date.now())

    console.log("New transaction:", transaction)

    if (this.identity.nodeType == "full" && this.accounts) {
      const { account: sender } = this.accounts.get(transaction.senderAddress)
      const { account: recipient } = this.accounts.get(transaction.recipientAddress)

      if (sender && recipient && sender.balance >= transaction.amount && sender.nonce == transaction.nonce) {
        sender.balance -= transaction.amount
        recipient.balance += transaction.amount
        sender.nonce += 1
        this.accounts.insert(sender)
        this.accounts.insert(recipient)
        this.repository.addTransaction(transaction, false)
      }
    }
  }

  private async handleNewAchievement(message: Message) {
    if (this.awesomeComStatus.phase != "Submission" || !this.inTPC) {
      return
    }
    const achievement = message.payload
    if (!isAchievement(achievement) || this.hasReceived.has(achievement.signature) || !verifyAchievement(achievement)) {
      return
    }
    this.hasReceived.set(achievement.signature, Date.now())

    console.log("New achievement:", achievement)
    this.pendingAchievements.push(achievement)
    const reviewerRequest: ReviewerRequest = {
      theme: this.awesomeComStatus.theme,
      achievement,
    }
    this.reviewer.assignAchievement(reviewerRequest)
  }

  private async handleNewReview(message: Message) {
    if (this.awesomeComStatus.phase != "Review" || !this.inTPC) {
      return
    }
    const review = message.payload
    if (!isReview(review) || this.hasReceived.has(review.signature) || !verifyReview(review)) {
      return
    }
    this.hasReceived.set(review.signature, Date.now())

    console.log("New review:", review)
    this.pendingReviews.push(review)
  }

  private async handleAccountRequest(message: Message) {
    if (this.identity.nodeType != "full" || !this.accounts) {
      return
    }
    const request = message.payload
    if (!isAccountRequest(request)) {
      return
    }
    console.log("Account request:", request)
    const { account, proof } = this.accounts.get(request.address)
    if (!account) {
      return
    }
    const response: AccountResponse = {
      requestId: request.requestId,
      account,
      proof,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.ACCOUNT_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleAccountResponse(message: Message) {
    const response = message.payload
    if (!isAccountResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    console.log("Account:", response.account)
  }

  private async handleChainHeadRequest(message: Message) {
    if (this.identity.nodeType != "full") {
      return
    }
    const request = message.payload
    if (!isChainHeadRequest(request)) {
      return
    }
    if (!this.chainHead) {
      return
    }

    const response: ChainHeadResponse = {
      requestId: request.requestId,
      chainHead: this.chainHead,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.CHAIN_HEAD,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleChainHeadResponse(message: Message) {
    if (this.identity.nodeType == "light") {
      return
    }
    const response = message.payload
    if (!isChainHeadResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    const chainHead = response.chainHead
    if (!verifyChainHead(chainHead)) {
      return
    }

    console.log("Chain head:", chainHead)
    if (this.chainHead == null || chainHead.latestBlockHeight > this.chainHead.latestBlockHeight) {
      console.log("Updating chain head:", chainHead)
      this.chainHead = chainHead
    }
  }

  private async handleBlockRequest(message: Message) {
    if (this.identity.nodeType != "full") {
      return
    }
    const request = message.payload
    if (!isBlockRequest(request)) {
      return
    }
  }

  private async handleBlockResponse(message: Message) {
    const response = message.payload
    if (!isBlockResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    console.log("New block:", response.block)
  }

  private async handleBlocksRequest(message: Message) {
    if (this.identity.nodeType != "full") {
      return
    }
    const request = message.payload
    if (!isBlocksRequest(request)) {
      return
    }
  }

  private async handleBlocksResponse(message: Message) {
    const response = message.payload
    if (!isBlocksResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    console.log("New blocks:", response.blocks)
  }

  private async handleTransactionRequest(message: Message) {
    if (this.identity.nodeType != "full") {
      return
    }
    const request = message.payload
    if (!isTransactionRequest(request)) {
      return
    }
  }

  private async handleTransactionResponse(message: Message) {
    const response = message.payload
    if (!isTransactionResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    console.log("New transaction:", response.transaction)
  }

  private async handleTransactionsRequest(message: Message) {
    if (this.identity.nodeType != "full") {
      return
    }
    const request = message.payload
    if (!isTransactionsRequest(request)) {
      return
    }
  }

  private async handleTransactionsResponse(message: Message) {
    const response = message.payload
    if (!isTransactionsResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    console.log("New transactions:", response.transactions)
  }

  private async handleAchievementRequest(message: Message) {
    if (this.identity.nodeType != "full") {
      return
    }
    const request = message.payload
    if (!isAchievementRequest(request)) {
      return
    }
  }

  private async handleAchievementResponse(message: Message) {
    const response = message.payload
    if (!isAchievementResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    console.log("New achievement:", response.achievement)
  }

  private async handleAchievementsRequest(message: Message) {
    if (this.identity.nodeType != "full") {
      return
    }
    const request = message.payload
    if (!isAchievementsRequest(request)) {
      return
    }
  }

  private async handleAchievementsResponse(message: Message) {
    const response = message.payload
    if (!isAchievementsResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    console.log("New achievements:", response.achievements)
  }

  private async handleReviewRequest(message: Message) {
    if (this.identity.nodeType != "full") {
      return
    }
    const request = message.payload
    if (!isReviewRequest(request)) {
      return
    }
  }

  private async handleReviewResponse(message: Message) {
    const response = message.payload
    if (!isReviewResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    console.log("New review:", response.review)
  }

  private async handleReviewsRequest(message: Message) {
    if (this.identity.nodeType != "full") {
      return
    }
    const request = message.payload
    if (!isReviewsRequest(request)) {
      return
    }
  }

  private async handleReviewsResponse(message: Message) {
    const response = message.payload
    if (!isReviewsResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    console.log("New reviews:", response.reviews)
  }

  private async createBlock(): Promise<Block | null> {
    if (this.identity.nodeType != "full" || !this.accounts) {
      return null
    }
    let previousHash = ""
    let previousHeight = -1
    const transactions = await this.repository.getPendingTransactions()
    const achievements = this.pendingAchievements
    const reviews = this.pendingReviews
    const previousBlock = await this.repository.getLatestBlock()

    if (previousBlock) {
      previousHash = previousBlock.header.hash
      previousHeight = previousBlock.header.height
    }

    const reviewsByAchievement = new Map<string, Review[]>()
    for (const review of reviews) {
      const reviewList = reviewsByAchievement.get(review.achievementSignature) || []
      reviewList.push(review)
      reviewsByAchievement.set(review.achievementSignature, reviewList)
    }

    const acceptedAchievements: Achievement[] = []
    const reviewsForAcceptedAchievements: Review[] = []

    for (const achievement of achievements) {
      const achievementReviews = reviewsByAchievement.get(achievement.signature) || []

      const latestReviews = achievementReviews
        .sort((a, b) => b.timestamp - a.timestamp)
        .filter((review, index, self) => index === self.findIndex((r) => r.reviewerAddress === review.reviewerAddress))

      if (latestReviews.length >= chainConfig.reviewRules.minReviewPerAchievement) {
        const overallScores = latestReviews.map((r) => r.scores.overall).sort((a, b) => a - b)
        const medianScore = overallScores[Math.floor(overallScores.length / 2)]

        if (medianScore >= chainConfig.reviewRules.acceptThreshold) {
          acceptedAchievements.push(achievement)
          reviewsForAcceptedAchievements.push(...latestReviews)
        }
      }
    }

    transactions.sort((a, b) => b.timestamp - a.timestamp)
    acceptedAchievements.sort((a, b) => b.timestamp - a.timestamp)
    reviewsForAcceptedAchievements.sort((a, b) => b.timestamp - a.timestamp)

    const blockHeader: BlockHeader = {
      height: previousHeight + 1,
      previousHash,
      accountsRoot: this.accounts.merkleRoot,
      transactionsRoot: MerkleTree.calculateRoot(transactions.map((t) => t.signature)),
      achievementsRoot: MerkleTree.calculateRoot(acceptedAchievements.map((a) => a.signature)),
      reviewsRoot: MerkleTree.calculateRoot(reviewsForAcceptedAchievements.map((r) => r.signature)),
      timestamp: Date.now(),
      hash: "",
    }
    const block: Block = {
      header: blockHeader,
      transactions,
      achievements: acceptedAchievements,
      reviews: reviewsForAcceptedAchievements,
    }
    block.header.hash = hashBlockHeader(block.header)
    return block
  }

  private async broadcastChainHead() {
    if (this.chainHead) {
      console.log("Broadcasting chain head:", this.chainHead)
      this.socket.emit("message.send", {
        from: this.identity.address,
        to: "*",
        room: `${chainConfig.chainId}:nodes`,
        type: MESSAGE_TYPE.CHAIN_HEAD,
        payload: this.chainHead,
        timestamp: Date.now(),
      })
    }
  }

  private async startChainHeadBroadcast() {
    this.broadcastChainHead()

    this.chainHeadBroadcastInterval = setInterval(() => {
      this.broadcastChainHead()
    }, this.chainHeadBroadcastPeriod)
  }

  private async stopChainHeadBroadcast() {
    if (this.chainHeadBroadcastInterval) {
      clearInterval(this.chainHeadBroadcastInterval)
    }
  }

  private async broadcastCandidateBlock() {
    if (this.candidateBlock) {
      this.socket.emit("message.send", {
        from: this.identity.address,
        to: "*",
        room: `${chainConfig.chainId}:nodes`,
        type: MESSAGE_TYPE.CANDIDATE_BLOCK,
        payload: this.candidateBlock,
        timestamp: Date.now(),
      })
    }
  }

  private async startCandidateBlockBroadcast() {
    this.broadcastCandidateBlock()

    this.candidateBlockBroadcastInterval = setInterval(() => {
      this.broadcastCandidateBlock()
    }, this.candidateBlockBroadcastPeriod)
  }

  private stopCandidateBlockBroadcast() {
    if (this.candidateBlockBroadcastInterval) {
      clearInterval(this.candidateBlockBroadcastInterval)
    }
  }

  private async broadcastNewBlock() {
    if (this.candidateBlock) {
      this.socket.emit("message.send", {
        from: this.identity.address,
        to: "*",
        room: `${chainConfig.chainId}:nodes`,
        type: MESSAGE_TYPE.NEW_BLOCK,
        payload: this.candidateBlock,
        timestamp: Date.now(),
      })
    }
  }

  private async startNewBlockBroadcast() {
    this.broadcastNewBlock()

    this.newBlockBroadcastInterval = setInterval(() => {
      this.broadcastNewBlock()
    }, this.newBlockBroadcastPeriod)
  }

  private stopNewBlockBroadcast() {
    if (this.newBlockBroadcastInterval) {
      clearInterval(this.newBlockBroadcastInterval)
    }
  }

  private cleanReceivedMessages() {
    const now = Date.now()
    for (const [key, timestamp] of this.hasReceived.entries()) {
      if (now - timestamp > this.cleanReceivedMessagesPeriod) {
        this.hasReceived.delete(key)
      }
    }
  }

  private startCleanReceivedMessages() {
    this.cleanReceivedMessagesInterval = setInterval(() => {
      this.cleanReceivedMessages()
    }, this.cleanReceivedMessagesPeriod)
  }

  private stopCleanReceivedMessages() {
    if (this.cleanReceivedMessagesInterval) {
      clearInterval(this.cleanReceivedMessagesInterval)
    }
  }

  private cleanup() {
    this.stopAwesomeComStatusUpdate()
    this.stopChainHeadBroadcast()
    this.stopCandidateBlockBroadcast()
    this.stopNewBlockBroadcast()
    this.stopCleanReceivedMessages()
    this.candidateBlock = null
    this.hasReceived.clear()
    this.pendingAchievements = []
    this.pendingReviews = []
  }
}
