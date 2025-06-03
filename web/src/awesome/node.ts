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
  ReviewScores,
  signReview,
} from "./awesome"
import { SparseMerkleTree } from "./merkle"
import {
  isChainHeadResponse,
  isReviewsResponse,
  MESSAGE_TYPE,
  isAchievementsResponse,
  isReviewResponse,
  isBlockResponse,
  isTransactionResponse,
  isTransactionsResponse,
  isAchievementResponse,
  isAccountResponse,
  isBlockHeaderResponse,
  isBlockHeadersResponse,
  AccountRequest,
  AccountsRequest,
  BlocksRequest,
  BlockHeadersRequest,
  ChainHeadRequest,
  BlockHeaderRequest,
  BlockRequest,
  AchievementsRequest,
  ReviewsRequest,
  AchievementRequest,
  isAccountsResponse,
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
  "target_block.updated": number
  "account.updated": Account
  "accounts.fetched": Account[]
  "block.new": Block
  "block.fetched": Block
  "block_header.new": BlockHeader
  "block_header.fetched": BlockHeader
  "block_headers.fetched": BlockHeader[]
  "achievement.new": Achievement
  "review.new": Review
  "transaction.new": Transaction
  "transaction.fetched": Transaction
  "transactions.fetched": Transaction[]
  "chain_head.updated": ChainHead
  "achievement.fetched": Achievement
  "achievements.fetched": Achievement[]
  "review.fetched": Review
  "reviews.fetched": Review[]
}

// light web node
export class AwesomeNodeLight {
  private awesomeComStatus: AwesomeComStatus = {
    session: 0,
    phase: "Announcement",
    phaseRemaining: 0,
    sessionRemaining: 0,
  }
  private socket: Socket<ClientEvents, ServerEvents>
  private wallet: Wallet
  private identity: Identity
  private account: Account
  private accounts: Account[] = []
  private eventListeners: Map<keyof EventMap, Set<unknown>> = new Map()

  // address of the full node that this node is syncing with
  private activePeers: Identity[] = []
  private syncPeer: string | null = null

  private transactions: Map<string, Transaction> = new Map()
  private achievements: Map<string, Achievement> = new Map()
  private reviews: Map<string, Review[]> = new Map()

  // created or received achievement signatures in the submission phase in current session
  private pendingAchievements: string[] = []

  private latestBlockHeight: number = -1

  // by height
  private blockHeaders: Map<number, BlockHeader> = new Map()
  private blocks: Map<number, Block> = new Map()

  // de-duplication of messages by data hash or signature
  private hasReceived: Map<string, number> = new Map()
  // process response only if requestId exists
  private sentRequests: Map<string, boolean> = new Map()

  private cleanReceivedMessagesPeriod: number = 30 * 60 * 1000
  private awesomeComStatusUpdatePeriod: number = 100

  private awesomeComStatusUpdateInterval: NodeJS.Timeout | null = null
  private cleanReceivedMessagesInterval: NodeJS.Timeout | null = null

  private WAIT_SYNC_PEER_INTERVAL: number = 200

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
      this.emit("target_block.updated", this.targetBlock)
    })

    this.on("awesomecom.review.started", async () => {})
  }

  public stop() {
    // Stop all intervals
    this.stopAwesomeComStatusUpdate()
    this.stopCleanReceivedMessages()

    // Disconnect socket
    if (this.socket.connected) {
      this.socket.disconnect()
    }

    // Clear all data
    this.hasReceived.clear()
    this.sentRequests.clear()
    this.achievements.clear()
    this.reviews.clear()
    this.pendingAchievements = []
    this.activePeers = []
    this.syncPeer = null
  }

  private sync() {
    this.requestBlockHeaders(this.latestBlockHeight, this.latestBlockHeight)
    this.requestPendingAchievements()
    this.requestAccount(this.identity.address)
    this.requestAccounts()
  }

  public isConnected(): boolean {
    return this.socket.connected
  }

  public getIdentity(): Identity {
    return { ...this.identity }
  }

  public getAccount(): Account {
    return { ...this.account }
  }

  public getSyncPeer(): string | null {
    return this.syncPeer
  }

  public setSyncPeer(peer: string) {
    this.syncPeer = peer
  }
  public getLatestBlockHeight(): number {
    return this.latestBlockHeight
  }

  public getAccounts(): Account[] {
    return this.accounts.slice()
  }

  public getBlockHeader(height: number): BlockHeader | undefined {
    return this.blockHeaders.get(height)
  }

  public getBlockHeaders(): BlockHeader[] {
    return Array.from(this.blockHeaders.values())
  }

  public getBlock(height: number): Block | undefined {
    if (this.blocks.has(height)) {
      return this.blocks.get(height)
    }
    this.requestBlock(height)
    return undefined
  }

  public getBlocks(): Block[] {
    return Array.from(this.blocks.values()).sort((a, b) => b.header.height - a.header.height)
  }

  public getActivePeers(): Identity[] {
    return this.activePeers.slice()
  }

  public getAwesomeComStatus(): AwesomeComStatus {
    return { ...this.awesomeComStatus }
  }

  public getAchievement(signature: string): Achievement | undefined {
    if (this.achievements.has(signature)) {
      return this.achievements.get(signature)
    }
    this.requestAchievement(signature)
    return undefined
  }

  public getPendingAchievements(): Achievement[] {
    return this.pendingAchievements
      .map((signature) => this.achievements.get(signature) || undefined)
      .filter((achievement) => achievement !== undefined) as Achievement[]
  }

  public getReviewsByAchievementSignature(achievementSignature: string): Review[] {
    if (this.reviews.has(achievementSignature)) {
      return this.reviews.get(achievementSignature) || []
    }
    this.requestReviewsByAchievementSignature(achievementSignature)
    return []
  }

  public async requestAccount(address: string): Promise<void> {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
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

  public async requestAccounts() {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
    }
    const requestId = crypto.randomUUID()
    const request: AccountsRequest = {
      requestId,
    }
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.ACCOUNTS_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
  }

  public async requestChainHead(): Promise<void> {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
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

  public async requestBlockHeader(height: number) {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
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

  public async requestBlockHeaders(fromHeight: number, toHeight: number) {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
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

  public async requestBlock(height: number) {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
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

  public async requestBlocks(fromHeight: number, toHeight: number) {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
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

  public async requestAchievement(signature: string) {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
    }

    const requestId = crypto.randomUUID()
    const request: AchievementRequest = {
      requestId,
      signature,
    }

    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.ACHIEVEMENT_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
  }

  public async requestPendingAchievements() {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
    }
    const requestId = crypto.randomUUID()
    const request: AchievementsRequest = {
      requestId,
      targetBlock: this.targetBlock,
    }
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.ACHIEVEMENTS_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
  }

  public async requestPendingReviews() {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
    }
    const requestId = crypto.randomUUID()
    const request: ReviewsRequest = {
      requestId,
      targetBlock: this.targetBlock,
    }
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.REVIEWS_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
  }

  public async requestReviewsByAchievementSignature(achievementSignature: string) {
    while (!this.syncPeer) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
    }
    const requestId = crypto.randomUUID()
    const request: ReviewsRequest = {
      requestId,
      achievementSignature,
    }
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: this.syncPeer,
      type: MESSAGE_TYPE.REVIEWS_REQUEST,
      payload: request,
      timestamp: Date.now(),
    })
    this.sentRequests.set(requestId, true)
  }

  public createAchievement(description: string, attachment: string): Achievement {
    const achievement: Achievement = {
      targetBlock: this.targetBlock,
      description,
      authorAddress: this.identity.address,
      attachment,
      timestamp: Date.now(),
      authorName: this.identity.name,
      authorPublicKey: this.identity.publicKey,
      signature: "",
    }
    achievement.signature = signAchievement(achievement, this.wallet)

    this.pendingAchievements.push(achievement.signature)
    this.achievements.set(achievement.signature, achievement)

    this.emit("achievement.new", achievement)
    const message: Message = {
      from: this.identity.address,
      to: "*",
      room: this.allNodesRoom,
      type: MESSAGE_TYPE.NEW_ACHIEVEMENT,
      payload: achievement,
      timestamp: Date.now(),
    }

    this.socket.emit("message.send", message)
    return achievement
  }

  public createReview(achievementSignature: string, comment: string, scores: ReviewScores) {
    const review: Review = {
      targetBlock: this.targetBlock,
      achievementSignature,
      comment,
      scores,
      reviewerAddress: this.identity.address,
      reviewerName: this.identity.name,
      reviewerPublicKey: this.identity.publicKey,
      timestamp: Date.now(),
      signature: "",
    }
    review.signature = signReview(review, this.wallet)

    const message: Message = {
      from: this.identity.address,
      to: "*",
      room: this.allNodesRoom,
      type: MESSAGE_TYPE.NEW_REVIEW,
      payload: review,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", message)

    if (!this.reviews.has(review.achievementSignature)) {
      this.reviews.set(review.achievementSignature, [review])
    } else {
      this.reviews.get(review.achievementSignature)!.push(review)
    }

    this.emit("review.new", review)
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

  get targetBlock() {
    return this.latestBlockHeight + 1
  }

  get fullNodesRoom() {
    return `${chainConfig.chainId}:fullnodes`
  }

  get allNodesRoom() {
    return `${chainConfig.chainId}:nodes`
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
      this.socket.emit("room.get_members", this.allNodesRoom)
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
        if (members.length > 0) {
          // TODO: request chain heads from multiple full nodes and select the best one or use trusted full node
          this.setSyncPeer(members[0].address)
          // this.setSyncPeer("0xE31a8d1AAf3C4D3f97B5668E6df1C946FFDd0A56")
          this.requestChainHead()
        }
      }
      if (room === this.allNodesRoom) {
        this.activePeers = members
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
    if (status.session !== this.awesomeComStatus.session || status.phase !== this.awesomeComStatus.phase) {
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
      case MESSAGE_TYPE.ACCOUNTS_RESPONSE:
        this.handleAccountsResponse(message)
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
    // TODO: handle actively broadcasted chain heads
    if (chainHead.latestBlockHeight > this.latestBlockHeight) {
      this.latestBlockHeight = chainHead.latestBlockHeight
      this.emit("target_block.updated", this.targetBlock)
    }
  }

  private async handleNewBlock(message: Message) {
    if (this.awesomeComStatus.phase != "Announcement") {
      return
    }
    const block = message.payload
    if (!isBlock(block) || this.hasReceived.has(block.header.hash) || !verifyBlock(block)) {
      return
    }
    this.hasReceived.set(block.header.hash, Date.now())

    // TODO: compare with current latest block
    if (
      block.header.height > this.latestBlockHeight &&
      (!this.blockHeaders.has(block.header.height - 1) ||
        block.header.previousHash == this.blockHeaders.get(block.header.height - 1)!.hash)
    ) {
      this.blockHeaders.set(block.header.height, block.header)
      this.blocks.set(block.header.height, block)
      this.emit("block_header.new", block.header)
      this.emit("block.new", block)
      this.latestBlockHeight = block.header.height
    }
  }

  private async handleNewTransaction(message: Message) {
    const transaction = message.payload
    if (!isTransaction(transaction) || this.hasReceived.has(transaction.signature) || !verifyTransaction(transaction)) {
      return
    }
    this.hasReceived.set(transaction.signature, Date.now())

    this.transactions.set(transaction.signature, transaction)
    this.emit("transaction.new", transaction)
  }

  private async handleNewAchievement(message: Message) {
    if (this.awesomeComStatus.phase != "Submission") {
      return
    }
    const achievement = message.payload
    if (!isAchievement(achievement) || this.hasReceived.has(achievement.signature) || !verifyAchievement(achievement)) {
      return
    }
    this.hasReceived.set(achievement.signature, Date.now())

    this.achievements.set(achievement.signature, achievement)
    if (achievement.targetBlock == this.targetBlock) {
      this.pendingAchievements = [...new Set([...this.pendingAchievements, achievement.signature])]
    }
    this.emit("achievement.new", achievement)
  }

  private async handleNewReview(message: Message) {
    if (this.awesomeComStatus.phase != "Submission" && this.awesomeComStatus.phase != "Review") {
      return
    }
    const review = message.payload
    if (!isReview(review) || this.hasReceived.has(review.signature) || !verifyReview(review)) {
      return
    }
    this.hasReceived.set(review.signature, Date.now())

    if (!this.reviews.has(review.achievementSignature)) {
      this.reviews.set(review.achievementSignature, [])
    }
    this.reviews.get(review.achievementSignature)!.push(review)

    this.emit("review.new", review)
  }

  private async handleAccountResponse(message: Message) {
    const response = message.payload
    if (!isAccountResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    while (!this.blockHeaders.get(this.latestBlockHeight)) {
      await new Promise((resolve) => setTimeout(resolve, this.WAIT_SYNC_PEER_INTERVAL))
    }
    const latestBlockHeader = this.blockHeaders.get(this.latestBlockHeight)
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

  private async handleAccountsResponse(message: Message) {
    const response = message.payload
    if (!isAccountsResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)
    this.accounts = response.accounts
    this.emit("accounts.fetched", this.accounts)
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

    if (this.latestBlockHeight < chainHead.latestBlockHeight) {
      this.latestBlockHeight = chainHead.latestBlockHeight
      this.emit("target_block.updated", this.targetBlock)
      this.emit("chain_head.updated", chainHead)

      // quick sync
      this.sync()
    }
  }

  private async handleBlockHeaderResponse(message: Message) {
    const response = message.payload
    if (!isBlockHeaderResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)
    this.blockHeaders.set(response.blockHeader.height, response.blockHeader)
    this.emit("block_header.fetched", response.blockHeader)
  }

  private async handleBlockHeadersResponse(message: Message) {
    const response = message.payload
    if (!isBlockHeadersResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    for (const blockHeader of response.blockHeaders) {
      this.blockHeaders.set(blockHeader.height, blockHeader)
    }
    this.emit("block_headers.fetched", response.blockHeaders)
  }

  private async handleBlockResponse(message: Message) {
    const response = message.payload
    if (!isBlockResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    this.blockHeaders.set(response.block.header.height, response.block.header)
    this.blocks.set(response.block.header.height, response.block)
    this.emit("block.fetched", response.block)
  }

  private async handleTransactionResponse(message: Message) {
    const response = message.payload
    if (!isTransactionResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    this.transactions.set(response.transaction.signature, response.transaction)
    this.emit("transaction.fetched", response.transaction)
  }

  private async handleTransactionsResponse(message: Message) {
    const response = message.payload
    if (!isTransactionsResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    for (const transaction of response.transactions) {
      this.transactions.set(transaction.signature, transaction)
    }
    this.emit("transactions.fetched", response.transactions)
  }

  private async handleAchievementResponse(message: Message) {
    const response = message.payload
    if (!isAchievementResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)
    this.achievements.set(response.achievement.signature, response.achievement)

    if (response.achievement.targetBlock == this.targetBlock) {
      this.pendingAchievements = [...new Set([...this.pendingAchievements, response.achievement.signature])]
    }

    this.emit("achievement.fetched", response.achievement)
  }

  private async handleAchievementsResponse(message: Message) {
    const response = message.payload
    if (!isAchievementsResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    for (const achievement of response.achievements) {
      this.achievements.set(achievement.signature, achievement)
      if (achievement.targetBlock == this.targetBlock) {
        this.pendingAchievements = [...new Set([...this.pendingAchievements, achievement.signature])]
      }
    }
    this.emit("achievements.fetched", response.achievements)
  }

  private async handleReviewResponse(message: Message) {
    const response = message.payload
    if (!isReviewResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    if (!this.reviews.has(response.review.achievementSignature)) {
      this.reviews.set(response.review.achievementSignature, [])
    }
    this.reviews.get(response.review.achievementSignature)!.push(response.review)

    this.emit("review.fetched", response.review)
  }

  private async handleReviewsResponse(message: Message) {
    const response = message.payload
    if (!isReviewsResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    for (const review of response.reviews) {
      if (!this.reviews.has(review.achievementSignature)) {
        this.reviews.set(review.achievementSignature, [])
      }
      this.reviews.get(review.achievementSignature)!.push(review)
    }
    this.emit("reviews.fetched", response.reviews)
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
