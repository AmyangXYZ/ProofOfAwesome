import { sha256 } from "js-sha256"
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
  isBlock,
  isTransaction,
  isAchievement,
  isReview,
  isChainHead,
  AwesomeComStatus,
  getAwesomeComStatus,
  chainConfig,
  BlockHeader,
  verifyChainHead,
  waitForGenesis,
  Account,
  signAchievement,
  ChainHead,
} from "./awesome"
import { SparseMerkleTree } from "./merkle"
import {
  isChainHeadResponse,
  isReviewsResponse,
  MESSAGE_TYPE,
  isAchievementsResponse,
  isReviewResponse,
  isBlockResponse,
  isBlocksResponse,
  isTransactionResponse,
  isTransactionsResponse,
  isAchievementResponse,
  isAccountResponse,
  isBlockHeaderResponse,
  isBlockHeadersResponse,
  AccountRequest,
  BlocksRequest,
  BlockHeadersRequest,
  ChainHeadRequest,
  BlockHeaderRequest,
  BlockRequest,
} from "./message"
import { io, Socket } from "socket.io-client"

interface EventMap {
  "node.connected": void
  "node.disconnected": void
  "peer.discovered": Identity[]
  "awesomecom.status.updated": AwesomeComStatus
  "awesomecom.submission.started": void
  "awesomecom.review.started": void
  "awesomecom.consensus.started": void
  "awesomecom.announcement.started": void
  "account.updated": Account
  "block.new": Block
  "block.fetched": Block
  "block_header.new": BlockHeader
  "block_header.fetched": BlockHeader
  "achievement.new": Achievement
  "review.new": Review
  "transaction.new": Transaction
  "transaction.fetched": Transaction
  "chain_head.updated": ChainHead
  "achievement.fetched": Achievement
  "review.fetched": Review
}

// light web node
export class AwesomeNodeLight {
  private awesomeComStatus: AwesomeComStatus = {
    edition: 0,
    phase: "Announcement",
    phaseRemaining: 0,
    editionRemaining: 0,
  }
  private socket: Socket<ClientEvents, ServerEvents>
  private wallet: Wallet
  private identity: Identity
  private account: Account
  private eventListeners: Map<keyof EventMap, Set<unknown>> = new Map()

  // address of the full node that this node is syncing with
  private activePeers: Identity[] = []
  private syncPeer: string | null = null

  // created or received in the submission phase in current edition
  private pendingAchievements: Achievement[] = []
  // created or received in the review phase in current edition
  private pendingReviews: Review[] = []

  private chainHead: ChainHead | null = null
  // by height
  private blockHeaders: Map<number, BlockHeader> = new Map()
  private blocks: Map<number, Block> = new Map()

  // de-duplication of messages by data hash or signature
  private hasReceived: Map<string, number> = new Map()
  // process response only if requestId exists
  private sentRequests: Map<string, boolean> = new Map()

  public inTPC: boolean = false

  private cleanReceivedMessagesPeriod: number = 30 * 60 * 1000
  private awesomeComStatusUpdatePeriod: number = 500

  private awesomeComStatusUpdateInterval: NodeJS.Timeout | null = null
  private cleanReceivedMessagesInterval: NodeJS.Timeout | null = null

  constructor(connectAddress: string, name: string, mnemonic: string, passphrase: string) {
    this.wallet = new Wallet(mnemonic, passphrase)

    this.identity = {
      chainId: chainConfig.chainId,
      name,
      address: this.wallet.derieveAddress(),
      nodeType: "light",
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

    this.account = {
      address: this.identity.address,
      balance: 0,
      nonce: 0,
      acceptedAchievements: 0,
    }

    this.socket = io(connectAddress, { autoConnect: false })
    this.setupSocket()
  }

  public async start() {
    await waitForGenesis()
    this.startAwesomeComStatusUpdate()
    this.startCleanReceivedMessages()
    this.socket.connect()

    this.on("awesomecom.submission.started", async () => {
      this.pendingAchievements = []
    })

    this.on("awesomecom.review.started", async () => {
      this.pendingReviews = []
    })
  }

  public isConnected() {
    return this.socket.connected
  }

  public getIdentity() {
    return this.identity
  }

  public getAccount() {
    return this.account
  }

  public getChainHead() {
    return this.chainHead
  }

  public getBlockHeaders() {
    return this.blockHeaders
  }

  public getBlocks() {
    return this.blocks
  }

  public getPendingAchievements() {
    return this.pendingAchievements
  }

  public getPendingReviews() {
    return this.pendingReviews
  }

  public getActivePeers() {
    return this.activePeers
  }

  public getSyncPeer() {
    return this.syncPeer
  }

  public setSyncPeer(peer: string) {
    this.syncPeer = peer
  }

  public getAwesomeComStatus() {
    return this.awesomeComStatus
  }

  public getAchievement(signature: string) {
    return this.pendingAchievements.find((achievement) => achievement.signature === signature)
  }

  public getReview(signature: string) {
    return this.pendingReviews.find((review) => review.achievementSignature === signature)
  }

  public getReviews(achievementSignature: string) {
    return this.pendingReviews.filter((review) => review.achievementSignature === achievementSignature)
  }

  public isInTPC() {
    return this.inTPC
  }

  public async joinTPC() {
    this.inTPC = true
    this.socket.emit("room.join", this.tpcRoom)
  }

  public async leaveTPC() {
    this.inTPC = false
    this.socket.emit("room.leave", this.tpcRoom)
  }

  public requestAccount(address: string) {
    if (!this.syncPeer) {
      console.error("No sync peer")
      return
    }
    const requestId = crypto.randomUUID()
    const request: AccountRequest = {
      requestId,
      address,
    }
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.ACCOUNT_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
  }

  public requestChainHead() {
    if (!this.syncPeer) {
      console.error("No sync peer")
      return
    }
    const requestId = crypto.randomUUID()
    const request: ChainHeadRequest = {
      requestId,
    }
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.CHAIN_HEAD_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
  }

  public createAchievement(description: string): Achievement {
    const achievement: Achievement = {
      edition: this.awesomeComStatus.edition,
      description,
      authorAddress: this.identity.address,
      attachments: [],
      timestamp: Date.now(),
      authorName: this.identity.name,
      authorPublicKey: this.identity.publicKey,
      signature: "",
    }
    achievement.signature = signAchievement(achievement, this.wallet)

    this.pendingAchievements.push(achievement)

    this.emit("achievement.new", achievement)
    const message: Message = {
      from: this.identity.address,
      to: "*",
      room: this.tpcRoom,
      type: MESSAGE_TYPE.NEW_ACHIEVEMENT,
      payload: achievement,
      timestamp: Date.now(),
    }

    this.socket.emit("message.send", message)
    return achievement
  }

  public requestBlockHeader(height: number) {
    if (!this.syncPeer) {
      console.error("No sync peer")
      return
    }
    const requestId = crypto.randomUUID()
    const request: BlockHeaderRequest = {
      requestId,
      height,
    }
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.BLOCK_HEADER_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
  }

  public requestBlockHeaders(fromHeight: number, toHeight: number) {
    if (!this.syncPeer) {
      console.error("No sync peer")
      return
    }
    const requestId = crypto.randomUUID()
    const request: BlockHeadersRequest = {
      requestId,
      fromHeight,
      toHeight,
    }
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.BLOCK_HEADERS_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
  }

  public requestBlock(height: number) {
    if (!this.syncPeer) {
      console.error("No sync peer")
      return
    }
    const requestId = crypto.randomUUID()
    const request: BlockRequest = {
      requestId,
      height,
    }
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.BLOCK_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
  }

  public requestBlocks(fromHeight: number, toHeight: number) {
    if (!this.syncPeer) {
      console.error("No sync peer")
      return
    }
    const requestId = crypto.randomUUID()
    const request: BlocksRequest = {
      requestId,
      fromHeight,
      toHeight,
    }
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.BLOCKS_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
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

  get fullNodesRoom() {
    return `${chainConfig.chainId}:fullnodes`
  }

  get allNodesRoom() {
    return `${chainConfig.chainId}:nodes`
  }

  get tpcRoom() {
    return `${chainConfig.chainId}:tpc`
  }

  private setupSocket() {
    this.socket.on("disconnect", () => {
      this.emit("node.disconnected", undefined)
    })
    this.socket.on("connect", () => {
      this.socket.emit("node.connect", this.identity)
    })

    this.socket.on("node.connected", () => {
      this.emit("node.connected", undefined)
      this.socket.emit("room.get_members", this.fullNodesRoom)
    })

    this.socket.on("message.received", (message: Message) => {
      if (message.from == this.identity.address) {
        return
      }
      this.handleMessage(message)
    })

    this.socket.on("room.members", async (room: string, members: Identity[]) => {
      if (room === this.fullNodesRoom) {
        this.emit("peer.discovered", members)
      }
    })
  }

  private startAwesomeComStatusUpdate() {
    this.updateAwesomeComStatus()
    this.awesomeComStatusUpdateInterval = setInterval(() => {
      this.updateAwesomeComStatus()
    }, this.awesomeComStatusUpdatePeriod)
  }

  private stopAwesomeComStatusUpdate() {
    if (this.awesomeComStatusUpdateInterval) {
      clearInterval(this.awesomeComStatusUpdateInterval)
    }
  }

  private updateAwesomeComStatus() {
    const status = getAwesomeComStatus()
    if (status.edition !== this.awesomeComStatus.edition || status.phase !== this.awesomeComStatus.phase) {
      // console.log(`[${status.edition}th AwesomeCom (Theme: ${status.theme})] Entering ${status.phase} phase`)
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
      case MESSAGE_TYPE.NEW_BLOCK:
        this.handleNewBlock(message)
        break
      case MESSAGE_TYPE.NEW_ACHIEVEMENT:
        this.handleNewAchievement(message)
        break
      case MESSAGE_TYPE.NEW_REVIEW:
        this.handleNewReview(message)
        break
      case MESSAGE_TYPE.ACCOUNT_RESPONSE:
        this.handleAccountResponse(message)
        break
      case MESSAGE_TYPE.CHAIN_HEAD_RESPONSE:
        this.handleChainHeadResponse(message)
        break
      case MESSAGE_TYPE.BLOCK_HEADER_RESPONSE:
        this.handleBlockHeaderResponse(message)
        break
      case MESSAGE_TYPE.BLOCK_HEADERS_RESPONSE:
        this.handleBlockHeadersResponse(message)
        break
      case MESSAGE_TYPE.BLOCK_RESPONSE:
        this.handleBlockResponse(message)
        break
      case MESSAGE_TYPE.BLOCKS_RESPONSE:
        this.handleBlocksResponse(message)
        break
      case MESSAGE_TYPE.TRANSACTION_RESPONSE:
        this.handleTransactionResponse(message)
        break
      case MESSAGE_TYPE.TRANSACTIONS_RESPONSE:
        this.handleTransactionsResponse(message)
        break
      case MESSAGE_TYPE.ACHIEVEMENT_RESPONSE:
        this.handleAchievementResponse(message)
        break
      case MESSAGE_TYPE.ACHIEVEMENTS_RESPONSE:
        this.handleAchievementsResponse(message)
        break
      case MESSAGE_TYPE.REVIEW_RESPONSE:
        this.handleReviewResponse(message)
        break
      case MESSAGE_TYPE.REVIEWS_RESPONSE:
        this.handleReviewsResponse(message)
        break
      default:
        console.error("Unknown message type:", message.from, message.type, message.timestamp)
        break
    }
  }

  private async handleChainHead(message: Message) {
    const chainHead = message.payload
    if (!isChainHead(chainHead) || this.hasReceived.has(chainHead.signature) || !verifyChainHead(chainHead)) {
      return
    }

    this.hasReceived.set(chainHead.signature, Date.now())
    if (this.chainHead == null || chainHead.latestBlockHeight > this.chainHead.latestBlockHeight) {
      this.chainHead = chainHead
      this.emit("chain_head.updated", chainHead)
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

    // TODO: compare with current latest block
    if (
      this.chainHead &&
      block.header.height > this.chainHead.latestBlockHeight &&
      block.header.previousHash == this.chainHead.latestBlockHash
    ) {
      this.emit("block.new", block)
      this.blockHeaders.set(block.header.height, block.header)
      this.blocks.set(block.header.height, block)
    }
  }

  private async handleNewTransaction(message: Message) {
    const transaction = message.payload
    if (!isTransaction(transaction) || this.hasReceived.has(transaction.signature) || !verifyTransaction(transaction)) {
      return
    }
    this.hasReceived.set(transaction.signature, Date.now())

    this.emit("transaction.new", transaction)
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

    this.pendingAchievements.push(achievement)
    this.emit("achievement.new", achievement)
  }

  private async handleNewReview(message: Message) {
    // if (this.awesomeComStatus.phase != "Review") {
    //   return
    // }
    const review = message.payload
    if (!isReview(review) || this.hasReceived.has(review.signature) || !verifyReview(review)) {
      return
    }
    this.hasReceived.set(review.signature, Date.now())
    this.pendingReviews.push(review)
    this.emit("review.new", review)
  }

  private async handleAccountResponse(message: Message) {
    const response = message.payload
    if (!isAccountResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    if (!this.chainHead) {
      console.error("No chain head found to verify account proof")
      return
    }
    const latestBlockHeader = this.blockHeaders.get(this.chainHead.latestBlockHeight)
    if (!latestBlockHeader) {
      console.error("No latest block header found to verify account proof")
      return
    }
    const verified = SparseMerkleTree.verifyProof(response.account, response.proof, latestBlockHeader.accountsRoot)
    if (verified) {
      this.account = response.account
      this.emit("account.updated", this.account)
    }
  }

  private async handleChainHeadResponse(message: Message) {
    const response = message.payload
    if (!isChainHeadResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    const chainHead = response.chainHead
    if (!verifyChainHead(chainHead)) {
      return
    }

    if (this.chainHead == null || chainHead.latestBlockHeight > this.chainHead.latestBlockHeight) {
      this.chainHead = chainHead
      this.emit("chain_head.updated", chainHead)
    }
  }

  private async handleBlockHeaderResponse(message: Message) {
    const response = message.payload
    if (!isBlockHeaderResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    this.emit("block_header.fetched", response.blockHeader)
    this.blockHeaders.set(response.blockHeader.height, response.blockHeader)
  }

  private async handleBlockHeadersResponse(message: Message) {
    const response = message.payload
    if (!isBlockHeadersResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    for (const blockHeader of response.blockHeaders) {
      this.emit("block_header.fetched", blockHeader)
      this.blockHeaders.set(blockHeader.height, blockHeader)
    }
  }

  private async handleBlockResponse(message: Message) {
    const response = message.payload
    if (!isBlockResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    this.emit("block.fetched", response.block)
    this.blockHeaders.set(response.block.header.height, response.block.header)
    this.blocks.set(response.block.header.height, response.block)
  }

  private async handleBlocksResponse(message: Message) {
    const response = message.payload
    if (!isBlocksResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    for (const block of response.blocks) {
      this.emit("block.fetched", block)
      this.blockHeaders.set(block.header.height, block.header)
      this.blocks.set(block.header.height, block)
    }
  }

  private async handleTransactionResponse(message: Message) {
    const response = message.payload
    if (!isTransactionResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    this.emit("transaction.fetched", response.transaction)
  }

  private async handleTransactionsResponse(message: Message) {
    const response = message.payload
    if (!isTransactionsResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    for (const transaction of response.transactions) {
      this.emit("transaction.fetched", transaction)
    }
  }

  private async handleAchievementResponse(message: Message) {
    const response = message.payload
    if (!isAchievementResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    this.emit("achievement.fetched", response.achievement)
  }

  private async handleAchievementsResponse(message: Message) {
    const response = message.payload
    if (!isAchievementsResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    for (const achievement of response.achievements) {
      this.emit("achievement.fetched", achievement)
    }
  }

  private async handleReviewResponse(message: Message) {
    const response = message.payload
    if (!isReviewResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    this.emit("review.fetched", response.review)
  }

  private async handleReviewsResponse(message: Message) {
    const response = message.payload
    if (!isReviewsResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    for (const review of response.reviews) {
      this.emit("review.fetched", review)
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
}
