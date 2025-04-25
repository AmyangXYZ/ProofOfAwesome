import { io, Socket } from "socket.io-client"
import { sha256 } from "js-sha256"
import { Repository } from "./repository"
import { MongoDBRepository } from "./repository_mongodb"
import { ClientEvents, ServerEvents, Identity, Message } from "./connect"
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
} from "./awesome"
import { calculateMerkleRoot } from "./merkle"
import { ChainHeadResponse, isChainHeadRequest, isChainHeadResponse, MESSAGE_TYPE } from "./message"
import { Reviewer } from "./reviewer"
import { AIReviewer } from "./reviewer_ai"
import { AI_API_KEYS } from "./ai_api_keys"
import OpenAI from "openai"

interface EventMap {
  "awesome_com.status.updated": AwesomeComStatus
  "awesome_com.achievement_submission.started": void
  "awesome_com.achievement_review.started": void
  "awesome_com.block_creation.started": void
  "awesome_com.wrap_up.started": void
  "block.added": Block
  "achievement.added": Achievement
  "review.added": Review
  "transaction.added": Transaction
}

export class AwesomeNode {
  public awesomeComStatus: AwesomeComStatus = {
    edition: 0,
    theme: "",
    phase: "Wrap Up",
    phaseRemaining: 0,
    editionRemaining: 0,
  }
  private socket: Socket<ClientEvents, ServerEvents>
  private wallet: Wallet
  private identity: Identity
  private repository: Repository
  private reviewer: Reviewer
  private eventListeners: Map<keyof EventMap, Set<unknown>> = new Map()

  private chainHead: ChainHead | null = null
  // created or received in the block creation phase in current edition
  private candidateBlock: Block | null = null
  // created or received in the achievement submission phase in current edition
  private pendingAchievements: Achievement[] = []
  // created or received in the achievement review phase in current edition
  private pendingReviews: Review[] = []

  // hash or signature
  private hasReceived: Map<string, boolean> = new Map()
  // requestId
  private sentRequests: Map<string, boolean> = new Map()

  private chainHeadBroadcastPeriod: number = 1 * 60 * 1000
  private candidateBlockBroadcastPeriod: number = 30 * 1000

  private statusUpdateInterval: NodeJS.Timeout | null = null
  private chainHeadBroadcastInterval: NodeJS.Timeout | null = null
  private candidateBlockBroadcastInterval: NodeJS.Timeout | null = null

  constructor(
    connectAddress: string,
    name: string,
    nodeType: "light" | "full",
    mnemonic?: string,
    passphrase?: string
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

    this.repository = new MongoDBRepository("mongodb://localhost:27017/awesome")

    // const xai = new OpenAI({
    //   apiKey: AI_API_KEYS.XAI,
    //   baseURL: "https://api.x.ai/v1",
    // })

    // const anthropic = new OpenAI({
    //   apiKey: AI_API_KEYS.ANTHROPIC,
    //   baseURL: "https://api.anthropic.com/v1/",
    // })
    this.reviewer = new AIReviewer(
      new OpenAI({
        apiKey: AI_API_KEYS.OPENAI,
      }),
      "gpt-4o-mini",
      true
    )

    this.socket = io(connectAddress, { autoConnect: false })
    this.setupSocket()
  }

  public async start() {
    await waitForGenesis()
    await this.repository.init()
    this.socket.connect()

    this.reviewer.onReviewSubmitted((reviewResult) => {
      console.log("Review result:", reviewResult)
      const review: Review = {
        edition: this.awesomeComStatus.edition,
        achievementSignature: reviewResult.achievementSignature,
        reviewerName: this.identity.name,
        reviewerAddress: this.identity.address,
        scores: reviewResult.scores,
        comment: reviewResult.comment,
        timestamp: Date.now(),
        reviewerPublicKey: this.identity.publicKey,
        signature: "",
      }
      review.signature = signReview(review, this.wallet)
      this.pendingReviews.push(review)
    })

    this.on("awesome_com.achievement_submission.started", async () => {
      this.pendingAchievements = []
    })

    this.on("awesome_com.achievement_review.started", async () => {
      this.pendingReviews = []
    })

    this.on("awesome_com.block_creation.started", async () => {
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

    this.on("awesome_com.wrap_up.started", async () => {
      if (this.identity.nodeType == "full") {
        this.stopCandidateBlockBroadcast()
      }
      if (this.candidateBlock) {
        await this.repository.addBlock(this.candidateBlock)
        this.emit("block.added", this.candidateBlock)
      }
      this.candidateBlock = null
      this.pendingAchievements = []
      this.pendingReviews = []
    })

    this.on("block.added", async () => {
      const latestBlock = await this.repository.getLatestBlock()
      this.chainHead = {
        chainId: chainConfig.chainId,
        latestBlockHeight: latestBlock ? latestBlock.header.height : 0,
        latestBlockHash: latestBlock ? latestBlock.header.hash : "",
        timestamp: Date.now(),
        nodePublicKey: this.identity.publicKey,
        signature: "",
      }
      this.chainHead.signature = signChainHead(this.chainHead, this.wallet)
      console.log(this.chainHead)
    })

    this.startAwesomeComStatusUpdate()
    if (this.identity.nodeType == "full") {
      this.startChainHeadBroadcast()
    }
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
        if (members.length == 1 && members[0].address === this.identity.address) {
          if (this.identity.nodeType === "full") {
            console.log("First node in the chain, initializing the chain")
          }
        } else if (members.length > 0) {
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
        case "Achievement Submission":
          this.emit("awesome_com.achievement_submission.started", undefined)
          break
        case "Achievement Review":
          this.emit("awesome_com.achievement_review.started", undefined)
          break
        case "Block Creation":
          this.emit("awesome_com.block_creation.started", undefined)
          break
        case "Wrap Up":
          this.emit("awesome_com.wrap_up.started", undefined)
          break
      }
    }
    this.awesomeComStatus = status
    this.emit("awesome_com.status.updated", status)
  }

  private handleMessage(message: Message) {
    switch (message.type) {
      case MESSAGE_TYPE.CHAIN_HEAD:
        this.handleChainHead(message)
        break
      case MESSAGE_TYPE.NEW_TRANSACTION:
        this.handleTransaction(message)
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
      case MESSAGE_TYPE.CHAIN_HEAD_REQUEST:
        if (this.identity.nodeType == "full") {
          this.handleChainHeadRequest(message)
        }
        break
      case MESSAGE_TYPE.CHAIN_HEAD_RESPONSE:
        this.handleChainHeadResponse(message)
        break
      default:
        console.log("Unknown message type:", message.type)
        break
    }
  }

  private async handleChainHeadRequest(message: Message) {
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

  private async handleChainHead(message: Message) {
    const chainHead = message.payload
    if (!isChainHead(chainHead)) {
      return
    }
    if (this.hasReceived.has(chainHead.signature)) {
      return
    }
    if (!verifyChainHead(chainHead)) {
      return
    }
    this.hasReceived.set(chainHead.signature, true)

    console.log("Chain head:", chainHead)
    if (this.chainHead == null || chainHead.latestBlockHeight > this.chainHead.latestBlockHeight) {
      console.log("Updating chain head:", chainHead)
      this.chainHead = chainHead
    }
  }

  private async handleChainHeadResponse(message: Message) {
    const response = message.payload
    if (!isChainHeadResponse(response)) {
      return
    }
    if (this.sentRequests.has(response.requestId)) {
      this.sentRequests.delete(response.requestId)
    } else {
      return
    }
    const chainHead = response.chainHead
    if (!isChainHead(chainHead)) {
      return
    }
    if (this.hasReceived.has(chainHead.signature)) {
      return
    }
    if (!verifyChainHead(chainHead)) {
      return
    }
    this.hasReceived.set(chainHead.signature, true)

    console.log("Chain head:", chainHead)
    if (this.chainHead == null || chainHead.latestBlockHeight > this.chainHead.latestBlockHeight) {
      console.log("Updating chain head:", chainHead)
      this.chainHead = chainHead
    }
  }

  private async handleCandidateBlock(message: Message) {
    if (this.awesomeComStatus.phase != "Block Creation") {
      return
    }
    const block = message.payload
    if (!isBlock(block)) {
      return
    }
    if (this.hasReceived.has(block.header.hash)) {
      return
    }
    if (!verifyBlock(block)) {
      return
    }
    this.hasReceived.set(block.header.hash, true)

    if (
      !this.candidateBlock ||
      block.transactions.length + block.achievements.length + block.reviews.length >
        this.candidateBlock.transactions.length +
          this.candidateBlock.achievements.length +
          this.candidateBlock.reviews.length
    ) {
      this.candidateBlock = block
    }
  }

  private async handleNewBlock(message: Message) {
    const block = message.payload
    if (!isBlock(block)) {
      return
    }
    if (this.hasReceived.has(block.header.hash)) {
      return
    }
    if (!verifyBlock(block)) {
      return
    }
    this.hasReceived.set(block.header.hash, true)

    console.log("New block:", block)
  }

  private async handleTransaction(message: Message) {
    const transaction = message.payload
    if (!isTransaction(transaction)) {
      return
    }
    if (this.hasReceived.has(transaction.signature)) {
      return
    }
    if (!verifyTransaction(transaction)) {
      return
    }
    this.hasReceived.set(transaction.signature, true)

    console.log("New transaction:", transaction)
  }

  private async handleNewAchievement(message: Message) {
    const achievement = message.payload
    if (!isAchievement(achievement)) {
      return
    }
    if (this.hasReceived.has(achievement.signature)) {
      return
    }
    if (!verifyAchievement(achievement)) {
      return
    }
    this.hasReceived.set(achievement.signature, true)

    console.log("New achievement:", achievement)
  }

  private async handleNewReview(message: Message) {
    const review = message.payload
    if (!isReview(review) || !verifyReview(review)) {
      return
    }
    if (this.hasReceived.has(review.signature)) {
      return
    }
    if (!verifyReview(review)) {
      return
    }
    this.hasReceived.set(review.signature, true)

    console.log("New review:", review)
  }

  private async createBlock(): Promise<Block | null> {
    const edition = this.awesomeComStatus.edition
    let previousHash = ""
    let previousHeight = -1
    const transactions = await this.repository.getPendingTransactions()
    const achievements = await this.repository.getAchievementsByEdition(edition)
    const reviews = await this.repository.getReviewsByEdition(edition)
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
      transactionsRoot: calculateMerkleRoot(transactions.map((t) => t.signature)),
      achievementsRoot: calculateMerkleRoot(acceptedAchievements.map((a) => a.signature)),
      reviewsRoot: calculateMerkleRoot(reviewsForAcceptedAchievements.map((r) => r.signature)),
      timestamp: Date.now(),
      hash: "",
      achievementDigests: acceptedAchievements.map((a) => ({
        title: a.title,
        signature: a.signature,
        authorName: a.authorName,
        authorAddress: a.authorAddress,
      })),
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

  private cleanup() {
    this.stopAwesomeComStatusUpdate()
    this.stopChainHeadBroadcast()
    this.stopCandidateBlockBroadcast()
    this.candidateBlock = null
    this.hasReceived.clear()
    this.pendingAchievements = []
    this.pendingReviews = []
  }
}
