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
} from "./awesome"
import { calculateMerkleRoot } from "./merkle"
import { MESSAGE_TYPE } from "./message"

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
  private eventListeners: Map<keyof EventMap, Set<unknown>> = new Map()

  private chainHead: ChainHead | null = null
  // created or received in the block creation phase in current edition
  private candidateBlock: Block | null = null
  // created or received in the achievement submission phase in current edition
  private pendingAchievements: Achievement[] = []
  // created or received in the achievement review phase in current edition
  private pendingReviews: Review[] = []

  // discard blocks that have been received
  private receivedBlocks: Map<string, boolean> = new Map()

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

    console.log("Created identity:", this.identity)

    this.repository = new MongoDBRepository("mongodb://localhost:27017/awesome")

    this.socket = io(connectAddress, { autoConnect: false })
    this.setupSocket()
  }

  public async start() {
    await this.repository.init()
    this.socket.connect()

    this.on("awesome_com.achievement_submission.started", async () => {
      this.pendingAchievements = []
    })

    this.on("awesome_com.achievement_review.started", async () => {
      this.pendingReviews = []
    })

    this.on("awesome_com.block_creation.started", async () => {
      this.receivedBlocks.clear()
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
      }
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
          const msg: Message = {
            from: this.identity.address,
            to: members[0].address,
            type: MESSAGE_TYPE.CHAIN_HEAD_REQUEST,
            payload: {},
            timestamp: Date.now(),
          }
          this.socket.emit("message.send", msg)
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
      case MESSAGE_TYPE.TRANSACTION:
        this.handleTransaction(message)
        break
      case MESSAGE_TYPE.CANDIDATE_BLOCK:
        this.handleCandidateBlock(message)
        break
      case MESSAGE_TYPE.BLOCK:
        this.handleBlock(message)
        break
      case MESSAGE_TYPE.ACHIEVEMENT:
        this.handleAchievement(message)
        break
      case MESSAGE_TYPE.REVIEW:
        this.handleReview(message)
        break
      case MESSAGE_TYPE.CHAIN_HEAD_REQUEST:
        if (this.identity.nodeType == "full") {
          this.handleGetChainHead(message)
        }
        break
      default:
        console.log("Unknown message type:", message.type)
        break
    }
  }

  private async handleGetChainHead(message: Message) {
    const block = await this.repository.getLatestBlock()
    if (block) {
      const chainHead: ChainHead = {
        chainId: chainConfig.chainId,
        latestBlockHeight: block.header.height,
        latestBlockHash: block.header.hash,
      }
      const msg: Message = {
        from: this.identity.address,
        to: message.from,
        type: MESSAGE_TYPE.CHAIN_HEAD,
        payload: chainHead,
        timestamp: Date.now(),
      }
      this.socket.emit("message.send", msg)
    }
  }

  private async handleChainHead(message: Message) {
    const chainHead = message.payload
    if (!isChainHead(chainHead)) {
      return
    }
    console.log("Chain head:", chainHead)
    if (this.chainHead == null || chainHead.latestBlockHeight > this.chainHead.latestBlockHeight) {
      console.log("Updating chain head:", chainHead)
      this.chainHead = chainHead
    }
  }

  private async handleBlock(message: Message) {
    const block = message.payload
    if (!isBlock(block)) {
      return
    }
    console.log("New block:", block)
  }

  private async handleCandidateBlock(message: Message) {
    if (this.awesomeComStatus.phase != "Block Creation") {
      return
    }
    const block = message.payload
    if (!isBlock(block)) {
      return
    }
    if (this.receivedBlocks.has(block.header.hash)) {
      return
    }
    if (!verifyBlock(block)) {
      return
    }
    this.receivedBlocks.set(block.header.hash, true)

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

  private async handleTransaction(message: Message) {
    const transaction = message.payload
    if (!isTransaction(transaction) || !verifyTransaction(transaction)) {
      return
    }
    console.log("New transaction:", transaction)
  }

  private async handleAchievement(message: Message) {
    const achievement = message.payload
    if (!isAchievement(achievement) || !verifyAchievement(achievement)) {
      return
    }
    console.log("New achievement:", achievement)
  }

  private async handleReview(message: Message) {
    const review = message.payload
    if (!isReview(review) || !verifyReview(review)) {
      return
    }
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
        const scores = latestReviews.map((r) => r.score).sort((a, b) => a - b)
        const medianScore = scores[Math.floor(scores.length / 2)]

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
        creatorName: a.creatorName,
        creatorAddress: a.creatorAddress,
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
    this.receivedBlocks.clear()
    this.pendingAchievements = []
    this.pendingReviews = []
  }
}
