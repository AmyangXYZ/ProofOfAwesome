import { io, Socket } from "socket.io-client"
import { sha256 } from "js-sha256"
import { ClientEvents, ServerEvents, Identity, Message } from "./connect"
import { Wallet } from "./wallet"
import { randomUUID } from "crypto"
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
  verifyBlockHeader,
  Account,
} from "./awesome"
import { MerkleTree, SparseMerkleTree } from "./merkle"
import {
  ChainHeadResponse,
  isChainHeadRequest,
  isChainHeadResponse,
  MESSAGE_TYPE,
  isReviewRequest,
  isAchievementsRequest,
  isBlockRequest,
  isBlocksRequest,
  isBlocksResponse,
  isTransactionRequest,
  isTransactionsRequest,
  isAchievementRequest,
  isAccountRequest,
  AccountResponse,
  isBlockHeaderRequest,
  isBlockHeadersRequest,
  BlockHeaderResponse,
  BlockHeadersResponse,
  BlockResponse,
  BlocksResponse,
  TransactionResponse,
  AchievementResponse,
  TransactionsResponse,
  isReviewsRequest,
  AchievementsResponse,
  ReviewsResponse,
  ReviewResponse,
  BlocksRequest,
  ChainHeadRequest,
  isAccountsRequest,
  AccountsResponse,
} from "./message"
import { Reviewer, ReviewResult } from "./reviewer"
import { SQLiteDB } from "./db"

function log(message: string, ...args: unknown[]) {
  const date = new Date()
  const timestamp = date
    .toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(",", "")
  console.log(`[${timestamp}] ${message}`, ...args)
}

interface EventMap {
  "node.connected": void
  "node.disconnected": void
  "sync.peers_discovered": Identity[]
  "sync.chain_head_fetched": ChainHead
  "sync.blocks_fetched": Block[]
  "sync.completed": void
  "awesomecom.status.updated": AwesomeComStatus
  "awesomecom.submission.started": void
  "awesomecom.review.started": void
  "awesomecom.consensus.started": void
  "awesomecom.announcement.started": void
}

enum SyncState {
  SYNCED,
  SELECTING_PEER,
  REQUESTING_CHAIN_HEAD,
  REQUESTING_BLOCKS,
}

// full node
export class AwesomeNode {
  private awesomeComStatus: AwesomeComStatus = {
    session: 0,
    phase: "Announcement",
    phaseRemaining: 0,
    sessionRemaining: 0,
  }
  private socket: Socket<ClientEvents, ServerEvents>
  private wallet: Wallet
  private identity: Identity
  private db: SQLiteDB
  private reviewer: Reviewer | null = null
  private eventListeners: Map<keyof EventMap, Set<unknown>> = new Map()

  // address of the full node that this node is syncing with
  private syncPeer: string | null = null
  private syncState: SyncState = SyncState.SYNCED

  // full nodes maintain the account states
  private accounts: SparseMerkleTree = new SparseMerkleTree()

  private latestBlockHeight: number = -1

  // created or received in the submission phase in current session
  private pendingAchievements: Achievement[] = []
  // created or received in the review phase in current session
  private pendingReviews: Review[] = []
  // created or received in the consensus phase in current session
  private candidateBlock: Block | null = null
  // created or received in the announcement phase in current session
  private newBlock: Block | null = null

  // de-duplication of messages by data hash or signature
  private hasReceived: Map<string, number> = new Map()
  // process response only if requestId exists
  private sentRequests: Map<string, boolean> = new Map()

  private chainHeadBroadcastPeriod: number = 1 * 60 * 1000
  private candidateBlockBroadcastPeriod: number = 5 * 1000
  private newBlockBroadcastPeriod: number = 3 * 1000
  private cleanReceivedMessagesPeriod: number = 2 * 180 * 1000
  private awesomeComStatusUpdatePeriod: number = 100

  private awesomeComStatusUpdateInterval: NodeJS.Timeout | null = null
  private chainHeadBroadcastInterval: NodeJS.Timeout | null = null
  private candidateBlockBroadcastInterval: NodeJS.Timeout | null = null
  private newBlockBroadcastInterval: NodeJS.Timeout | null = null
  private cleanReceivedMessagesInterval: NodeJS.Timeout | null = null

  constructor(connectAddress: string, name: string, mnemonic: string, passphrase: string, reviewer?: Reviewer) {
    this.wallet = new Wallet(mnemonic, passphrase)

    this.identity = {
      chainId: chainConfig.chainId,
      name,
      address: this.wallet.derieveAddress(),
      nodeType: "full",
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
    log("Created identity:", this.identity)
    this.accounts = new SparseMerkleTree()

    this.db = new SQLiteDB()

    if (reviewer) {
      this.reviewer = reviewer
    }

    this.socket = io(connectAddress, { autoConnect: false })
    this.setupSocket()
  }

  public async start() {
    this.socket.connect()

    this.on("sync.completed", async () => {
      this.startAwesomeComStatusUpdate()
      this.startChainHeadBroadcast()
    })

    this.on("node.connected", async () => {
      log("connected to AwesomeConnect")

      const loaded = await this.loadBlocksFromRepository()
      if (loaded) {
        const latestBlockHeader = this.db.getLatestBlockHeader()
        if (latestBlockHeader) {
          this.latestBlockHeight = latestBlockHeader.height
          this.emit("sync.completed", undefined)
        }
      } else {
        log("no valid blocks from repository, syncing from network")
        this.db.clear()
        this.accounts = new SparseMerkleTree()
        this.syncState = SyncState.SELECTING_PEER
        this.socket.emit("room.get_members", this.fullNodesRoom)
      }
    })

    this.on("sync.peers_discovered", async (peers: Identity[]) => {
      if (this.syncState == SyncState.SELECTING_PEER) {
        if (peers.length > 0 && peers[0].address == this.identity.address) {
          log("I am the genesis node, creating genesis block")
          const genesisBlock = await this.createBlock()
          if (genesisBlock) {
            log("created genesis block:", genesisBlock.header)
            this.db.addBlock(genesisBlock)
            this.latestBlockHeight = genesisBlock.header.height
            this.emit("sync.completed", undefined)
          }
        } else if (peers.length > 1) {
          for (const peer of peers) {
            if (peer.address != this.identity.address) {
              this.syncPeer = peer.address
              log("syncing with peer:", this.syncPeer)
              this.syncState = SyncState.REQUESTING_CHAIN_HEAD
              this.requestChainHead()
              break
            }
          }
        }
      }
    })

    this.on("sync.chain_head_fetched", async (chainHead: ChainHead) => {
      if (this.syncState == SyncState.REQUESTING_CHAIN_HEAD) {
        this.syncState = SyncState.REQUESTING_BLOCKS
        // TODO: split into multiple requests if the chain is too long
        this.requestBlocks(0, chainHead.latestBlockHeight)
      }
    })

    this.on("sync.blocks_fetched", async (blocks: Block[]) => {
      // this.rebuildChain(blocks)
      if (this.syncState == SyncState.REQUESTING_BLOCKS) {
        log("Fetched %d blocks from %s", blocks.length, this.syncPeer)
        blocks.sort((a, b) => a.header.height - b.header.height)
        this.accounts = new SparseMerkleTree()
        let invalid = false
        for (const [index, block] of blocks.entries()) {
          if (verifyBlock(block)) {
            if (index > 0) {
              if (block.header.previousHash != blocks[index - 1].header.hash) {
                invalid = true
                break
              }
            }
          } else {
            invalid = true
            break
          }
          this.assignRewards(block)

          for (const transaction of block.transactions) {
            const { account: sender } = this.accounts.get(transaction.senderAddress)
            const { account: recipient } = this.accounts.get(transaction.recipientAddress)
            if (!sender || !recipient) {
              invalid = true
              break
            }
            sender.balance = this.formatDecimal(sender.balance - transaction.amount)
            recipient.balance = this.formatDecimal(recipient.balance + transaction.amount)
            sender.nonce += 1
            this.accounts.insert(sender)
            this.accounts.insert(recipient)
          }
          if (this.accounts.merkleRoot != block.header.accountsRoot) {
            invalid = true
            break
          }
        }
        if (invalid) {
          log("Invalid blockchain, selecting another sync peer")
          this.syncState = SyncState.SELECTING_PEER
          // TODO: select another sync peer and restart the sync process
          return
        }
        for (const block of blocks) {
          this.db.addBlock(block)
        }
        this.syncState = SyncState.SYNCED
        log("Blockchain is valid, synchronization completed")
        this.latestBlockHeight = blocks[blocks.length - 1].header.height
        this.emit("sync.completed", undefined)
      }
    })

    if (this.reviewer) {
      this.reviewer.onReviewSubmitted((result: ReviewResult) => {
        const review: Review = {
          targetBlock: this.targetBlock,
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

        // broadacst review
        const message: Message = {
          from: this.identity.address,
          to: "*",
          room: this.allNodesRoom,
          type: MESSAGE_TYPE.NEW_REVIEW,
          payload: review,
          timestamp: Date.now(),
        }
        this.socket.emit("message.send", message)
      })
    }

    this.on("awesomecom.submission.started", async () => {
      this.newBlock = null
      this.stopNewBlockBroadcast()
      this.pendingAchievements = []
      this.pendingReviews = []
    })

    this.on("awesomecom.review.started", async () => {})

    this.on("awesomecom.consensus.started", async () => {
      this.candidateBlock = await this.createBlock()
      if (this.candidateBlock) {
        this.startCandidateBlockBroadcast()
      } else {
        log(`No activities, skipping block creation`)
      }
    })

    this.on("awesomecom.announcement.started", async () => {
      if (this.candidateBlock) {
        this.stopCandidateBlockBroadcast()

        this.newBlock = this.candidateBlock
        log("new block header:", this.newBlock.header)
        this.candidateBlock = null

        this.db.addBlock(this.newBlock)
        this.latestBlockHeight = this.newBlock.header.height
        this.startNewBlockBroadcast()
      }
    })

    this.startCleanReceivedMessages()
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

  get targetBlock() {
    return this.latestBlockHeight + 1
  }

  private setupSocket() {
    this.socket.on("connect", () => {
      this.socket.emit("node.connect", this.identity)
    })

    this.socket.on("node.connected", () => {
      this.emit("node.connected", undefined)
    })

    this.socket.on("message.received", (message: Message) => {
      if (message.from == this.identity.address) {
        return
      }
      this.handleMessage(message)
    })

    this.socket.on("room.members", async (room: string, members: Identity[]) => {
      if (this.syncState == SyncState.SELECTING_PEER && room === this.fullNodesRoom) {
        this.emit("sync.peers_discovered", members)
      }
    })
  }

  private async loadBlocksFromRepository(): Promise<boolean> {
    const latestBlockHeader = this.db.getLatestBlockHeader()
    this.accounts = new SparseMerkleTree()

    if (!latestBlockHeader || !verifyBlockHeader(latestBlockHeader)) {
      // invalid local blocks, clear the repository and fetch from the network
      return false
    }

    const blocks = this.db.getBlocks(0, latestBlockHeader.height)
    if (blocks.length == 0) {
      return false
    }
    log(`${blocks.length} blocks loaded from repository`)

    for (const [index, block] of blocks.entries()) {
      if (!verifyBlock(block)) {
        // invalid local blocks, clear the repository and fetch from the network
        return false
      }

      if (index > 0) {
        const previousBlock = blocks[index - 1]
        if (block.header.previousHash !== previousBlock.header.hash) {
          // invalid local blocks, clear the repository and fetch from the network
          return false
        }
      }

      // apply rewards and verify account consistency
      this.assignRewards(block)

      for (const transaction of block.transactions) {
        const { account: sender } = this.accounts.get(transaction.senderAddress)
        const { account: recipient } = this.accounts.get(transaction.recipientAddress)
        if (!sender || !recipient) {
          return false
        }
        sender.balance = this.formatDecimal(sender.balance - transaction.amount)
        recipient.balance = this.formatDecimal(recipient.balance + transaction.amount)
        sender.nonce += 1
        this.accounts.insert(sender)
        this.accounts.insert(recipient)
      }
      if (this.accounts.merkleRoot !== block.header.accountsRoot) {
        return false
      }
    }
    log(`${blocks.length} blocks loaded and verified`)
    console.log(this.accounts.merkleRoot)
    return true
  }

  public async requestChainHead(): Promise<void> {
    if (!this.syncPeer) {
      return
    }
    const requestId = randomUUID()
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

  private async requestBlocks(fromHeight: number, toHeight: number) {
    if (!this.syncPeer) {
      return
    }
    const requestId = randomUUID()
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
      case MESSAGE_TYPE.ACCOUNTS_REQUEST:
        this.handleAccountsRequest(message)
        break
      case MESSAGE_TYPE.CHAIN_HEAD_REQUEST:
        this.handleChainHeadRequest(message)
        break
      case MESSAGE_TYPE.CHAIN_HEAD_RESPONSE:
        this.handleChainHeadResponse(message)
        break
      case MESSAGE_TYPE.BLOCK_HEADER_REQUEST:
        this.handleBlockHeaderRequest(message)
        break
      case MESSAGE_TYPE.BLOCK_HEADERS_REQUEST:
        this.handleBlockHeadersRequest(message)
        break
      case MESSAGE_TYPE.BLOCK_REQUEST:
        this.handleBlockRequest(message)
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
      case MESSAGE_TYPE.TRANSACTIONS_REQUEST:
        this.handleTransactionsRequest(message)
        break
      case MESSAGE_TYPE.ACHIEVEMENT_REQUEST:
        this.handleAchievementRequest(message)
        break
      case MESSAGE_TYPE.ACHIEVEMENTS_REQUEST:
        this.handleAchievementsRequest(message)
        break
      case MESSAGE_TYPE.REVIEW_REQUEST:
        this.handleReviewRequest(message)
        break
      case MESSAGE_TYPE.REVIEWS_REQUEST:
        this.handleReviewsRequest(message)
        break
      default:
        log("Unknown message type:", message.from, message.type, message.timestamp)
        break
    }
  }

  private rebuildChain(blocks: Block[]) {
    this.accounts = new SparseMerkleTree()
    blocks.sort((a, b) => a.header.height - b.header.height)

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]
      if (i > 0) {
        block.header.previousHash = blocks[i - 1].header.hash
      }
      const oldHash = block.header.hash
      this.assignRewards(block)

      block.transactions.sort((a, b) => {
        const timeDiff = b.timestamp - a.timestamp
        if (timeDiff !== 0) return timeDiff
        return a.signature.localeCompare(b.signature)
      })
      block.header.transactionsRoot = MerkleTree.calculateRoot(
        block.transactions.map((transaction) => transaction.signature)
      )
      for (const transaction of block.transactions) {
        const { account: sender } = this.accounts.get(transaction.senderAddress)
        const { account: recipient } = this.accounts.get(transaction.recipientAddress)
        if (!sender || !recipient) {
          return false
        }
        sender.balance = this.formatDecimal(sender.balance - transaction.amount)
        recipient.balance = this.formatDecimal(recipient.balance + transaction.amount)
        sender.nonce += 1
        this.accounts.insert(sender)
        this.accounts.insert(recipient)
      }

      block.header.accountsRoot = this.accounts.merkleRoot
      block.header.hash = hashBlockHeader(block.header)
      console.log("rebuilding chain:", block.header.height, "oldHash:", oldHash, "newHash:", block.header.hash)
      this.db.addBlock(block)
    }
    console.log("rebuild chain completed")
  }

  private assignRewards(block: Block) {
    // assign achievement rewards
    for (const achievement of block.achievements) {
      let { account } = this.accounts.get(achievement.authorAddress)
      if (!account) {
        account = {
          name: achievement.authorName,
          address: achievement.authorAddress,
          balance: 0,
          nonce: 0,
          acceptedAchievements: 0,
          includedReviews: 0,
        } as Account
      }
      account.name = achievement.authorName
      account.acceptedAchievements++
      account.balance = this.formatDecimal(account.balance + chainConfig.rewardRules.acceptedAchievement)
      this.accounts.insert(account)
    }

    // assign review rewards
    for (const review of block.reviews) {
      let { account } = this.accounts.get(review.reviewerAddress)
      if (!account) {
        account = {
          name: review.reviewerName,
          address: review.reviewerAddress,
          balance: 0,
          nonce: 0,
          acceptedAchievements: 0,
          includedReviews: 0,
        } as Account
      }
      account.name = review.reviewerName
      account.balance = this.formatDecimal(account.balance + chainConfig.rewardRules.review)
      account.includedReviews += 1
      this.accounts.insert(account)
    }
  }

  private async handleChainHead(message: Message) {
    const chainHead = message.payload
    if (!isChainHead(chainHead) || this.hasReceived.has(chainHead.signature) || !verifyChainHead(chainHead)) {
      return
    }

    this.hasReceived.set(chainHead.signature, Date.now())
    // TODO: handle actively broadcasted chain heads
    // log("Chain head:", chainHead)
  }

  private async handleCandidateBlock(message: Message) {
    if (this.awesomeComStatus.phase != "Consensus") {
      return
    }
    const block = message.payload
    if (
      !isBlock(block) ||
      this.hasReceived.has(block.header.hash) ||
      block.header.height != this.targetBlock ||
      !verifyBlock(block)
    ) {
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
    if (
      !isBlock(block) ||
      this.hasReceived.has(block.header.hash) ||
      block.header.height != this.targetBlock ||
      !verifyBlock(block)
    ) {
      return
    }
    this.hasReceived.set(block.header.hash, Date.now())

    if (this.newBlock == null || block.header.height > this.newBlock.header.height) {
      this.newBlock = block
      this.db.addBlock(block)
    }
  }

  private async handleNewTransaction(message: Message) {
    const transaction = message.payload
    console.log(transaction)
    if (!isTransaction(transaction) || this.hasReceived.has(transaction.signature) || !verifyTransaction(transaction)) {
      return
    }
    this.hasReceived.set(transaction.signature, Date.now())
    if (transaction.blockHeight !== -1) {
      return
    }
    const { account: sender } = this.accounts.get(transaction.senderAddress)
    const { account: recipient } = this.accounts.get(transaction.recipientAddress)
    if (!sender || !recipient) {
      return
    }
    log(
      "new transaction:",
      transaction.signature.slice(0, 7),
      transaction.senderAddress.slice(0, 9),
      "->",
      transaction.recipientAddress.slice(0, 9),
      transaction.amount
    )

    if (sender && recipient && sender.balance >= transaction.amount && sender.nonce == transaction.nonce) {
      sender.balance = this.formatDecimal(sender.balance - transaction.amount)
      recipient.balance = this.formatDecimal(recipient.balance + transaction.amount)
      sender.nonce += 1
      this.accounts.insert(sender)
      this.accounts.insert(recipient)
      this.db.addTransaction(transaction)
    }
  }

  private async handleNewAchievement(message: Message) {
    if (this.awesomeComStatus.phase != "Submission") {
      return
    }
    const achievement = message.payload
    if (
      !isAchievement(achievement) ||
      this.hasReceived.has(achievement.signature) ||
      achievement.targetBlock != this.targetBlock ||
      !verifyAchievement(achievement)
    ) {
      return
    }
    this.hasReceived.set(achievement.signature, Date.now())

    this.pendingAchievements.push(achievement)
    if (this.reviewer) {
      this.reviewer.assignAchievement(achievement)
    }
  }

  private async handleNewReview(message: Message) {
    if (this.awesomeComStatus.phase != "Submission" && this.awesomeComStatus.phase != "Review") {
      return
    }
    const review = message.payload
    if (
      !isReview(review) ||
      this.hasReceived.has(review.signature) ||
      review.targetBlock != this.targetBlock ||
      !verifyReview(review)
    ) {
      return
    }
    this.hasReceived.set(review.signature, Date.now())

    this.pendingReviews.push(review)
  }

  private async handleAccountRequest(message: Message) {
    const request = message.payload
    if (!isAccountRequest(request)) {
      return
    }
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

  private async handleAccountsRequest(message: Message) {
    const request = message.payload
    if (!isAccountsRequest(request)) {
      return
    }
    const response: AccountsResponse = {
      requestId: request.requestId,
      accounts: this.accounts.getAllAccounts(),
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.ACCOUNTS_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleChainHeadRequest(message: Message) {
    const request = message.payload
    if (!isChainHeadRequest(request)) {
      return
    }
    const chainHead = await this.createChainHead()

    const response: ChainHeadResponse = {
      requestId: request.requestId,
      chainHead,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.CHAIN_HEAD_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
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

    if (this.syncState == SyncState.REQUESTING_CHAIN_HEAD) {
      this.emit("sync.chain_head_fetched", chainHead)
    }
  }

  private async handleBlockHeaderRequest(message: Message) {
    const request = message.payload
    if (!isBlockHeaderRequest(request)) {
      return
    }
    const header = this.db.getBlockHeader(request.height)
    if (!header) {
      return
    }
    const response: BlockHeaderResponse = {
      requestId: request.requestId,
      blockHeader: header,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.BLOCK_HEADER_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleBlockHeadersRequest(message: Message) {
    const request = message.payload
    if (!isBlockHeadersRequest(request)) {
      return
    }
    const headers = this.db.getBlockHeaders(request.fromHeight, request.toHeight)
    const response: BlockHeadersResponse = {
      requestId: request.requestId,
      blockHeaders: headers,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.BLOCK_HEADERS_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleBlockRequest(message: Message) {
    const request = message.payload
    if (!isBlockRequest(request)) {
      return
    }
    const block = this.db.getBlock(request.height)
    if (!block) {
      return
    }
    const response: BlockResponse = {
      requestId: request.requestId,
      block,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.BLOCK_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleBlocksRequest(message: Message) {
    const request = message.payload
    if (!isBlocksRequest(request)) {
      return
    }
    const blocks = this.db.getBlocks(request.fromHeight, request.toHeight)
    const response: BlocksResponse = {
      requestId: request.requestId,
      blocks,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.BLOCKS_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleBlocksResponse(message: Message) {
    const response = message.payload
    if (!isBlocksResponse(response) || !this.sentRequests.has(response.requestId)) {
      return
    }
    this.sentRequests.delete(response.requestId)

    if (this.syncState == SyncState.REQUESTING_BLOCKS) {
      this.emit("sync.blocks_fetched", response.blocks)
    }
  }

  private async handleTransactionRequest(message: Message) {
    const request = message.payload
    if (!isTransactionRequest(request)) {
      return
    }
    const transaction = this.db.getTransactionBySignature(request.signature)
    if (!transaction) {
      return
    }
    const response: TransactionResponse = {
      requestId: request.requestId,
      transaction,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.TRANSACTION_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleTransactionsRequest(message: Message) {
    const request = message.payload
    if (!isTransactionsRequest(request)) {
      return
    }
    let transactions: Transaction[] = []

    if (request.senderAddress && request.recipientAddress) {
      const senderTransactions = this.db.getTransactionsBySender(request.senderAddress)
      transactions = senderTransactions.filter((t) => t.recipientAddress === request.recipientAddress)
    } else if (request.senderAddress) {
      transactions = this.db.getTransactionsBySender(request.senderAddress)
    } else if (request.recipientAddress) {
      transactions = this.db.getTransactionsByRecipient(request.recipientAddress)
    } else {
      transactions = this.db.getAllTransactions()
    }

    const response: TransactionsResponse = {
      requestId: request.requestId,
      transactions,
    }

    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.TRANSACTIONS_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleAchievementRequest(message: Message) {
    const request = message.payload
    if (!isAchievementRequest(request)) {
      return
    }
    let achievement: Achievement | null | undefined = null

    // first check if the achievement is in the pending list
    achievement = this.pendingAchievements.find((a) => a.signature == request.signature)

    // if not, check if the achievement is in the repository
    if (!achievement) {
      achievement = this.db.getAchievementBySignature(request.signature)
    }

    // if still not found, return
    if (!achievement) {
      return
    }

    const response: AchievementResponse = {
      requestId: request.requestId,
      achievement,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.ACHIEVEMENT_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleAchievementsRequest(message: Message) {
    const request = message.payload
    if (!isAchievementsRequest(request)) {
      return
    }
    if (this.targetBlock == request.targetBlock) {
      const response: AchievementsResponse = {
        requestId: request.requestId,
        achievements: this.pendingAchievements,
      }
      const msg: Message = {
        from: this.identity.address,
        to: message.from,
        type: MESSAGE_TYPE.ACHIEVEMENTS_RESPONSE,
        payload: response,
        timestamp: Date.now(),
      }
      this.socket.emit("message.send", msg)
    } else if (request.authorAddress != undefined) {
      const achievements = this.db.getAchievementsByAuthor(request.authorAddress)
      const response: AchievementsResponse = {
        requestId: request.requestId,
        achievements,
      }
      const msg: Message = {
        from: this.identity.address,
        to: message.from,
        type: MESSAGE_TYPE.ACHIEVEMENTS_RESPONSE,
        payload: response,
        timestamp: Date.now(),
      }
      this.socket.emit("message.send", msg)
    }
  }

  private async handleReviewRequest(message: Message) {
    const request = message.payload
    if (!isReviewRequest(request)) {
      return
    }
    const review = this.db.getReviewBySignature(request.signature)
    if (!review) {
      return
    }
    const response: ReviewResponse = {
      requestId: request.requestId,
      review,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.REVIEW_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async handleReviewsRequest(message: Message) {
    const request = message.payload
    if (!isReviewsRequest(request)) {
      return
    }
    let reviews: Review[] = []

    if (this.targetBlock == request.targetBlock) {
      // if asking for all pending reviews
      reviews = this.pendingReviews
    } else if (request.achievementSignature != undefined) {
      // if achievement is still pending, also find the reviews in the pending list
      const achievement = this.pendingAchievements.find((a) => a.signature == request.achievementSignature)
      if (achievement) {
        reviews = this.pendingReviews.filter((r) => r.achievementSignature == request.achievementSignature)
      }
      // if achievement is not pending, fetch reviews from the repository
      if (reviews.length == 0) {
        reviews = this.db.getReviewsByAchievement(request.achievementSignature)
      }
    } else if (request.reviewerAddress != undefined) {
      reviews = this.db.getReviewsByReviewer(request.reviewerAddress)
      if (request.limit != undefined) {
        reviews = reviews.sort((a, b) => b.timestamp - a.timestamp).slice(0, request.limit)
      }
    }
    const response: ReviewsResponse = {
      requestId: request.requestId,
      reviews: reviews,
    }
    const msg: Message = {
      from: this.identity.address,
      to: message.from,
      type: MESSAGE_TYPE.REVIEWS_RESPONSE,
      payload: response,
      timestamp: Date.now(),
    }
    this.socket.emit("message.send", msg)
  }

  private async createChainHead(): Promise<ChainHead> {
    const latestBlock = this.db.getLatestBlockHeader()

    const chainHead: ChainHead = {
      chainId: chainConfig.chainId,
      latestBlockHeight: latestBlock?.height ?? 0,
      latestBlockHash: latestBlock?.hash ?? "",
      timestamp: Date.now(),
      nodePublicKey: this.identity.publicKey,
      signature: "",
    }
    chainHead.signature = signChainHead(chainHead, this.wallet)
    return chainHead
  }

  private async createBlock(): Promise<Block | null> {
    let previousHash = ""
    let previousHeight = -1
    const transactions = this.db.getTransactionsByBlockHeight(-1)
    const achievements = this.pendingAchievements
    const reviews = this.pendingReviews
    const previousBlockHeader = this.db.getLatestBlockHeader()

    if (previousBlockHeader) {
      previousHash = previousBlockHeader.hash
      previousHeight = previousBlockHeader.height
    }

    const height = previousHeight + 1

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
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter(
          (review, index, self) =>
            index === self.findIndex((r) => r.reviewerAddress === review.reviewerAddress) &&
            review.reviewerAddress !== achievement.authorAddress
        )

      if (latestReviews.length >= chainConfig.reviewRules.minReviewPerAchievement) {
        const overallScores = latestReviews.map((r) => r.scores.overall).sort((a, b) => a - b)
        const medianScore = overallScores[Math.floor(overallScores.length / 2)]

        if (medianScore >= chainConfig.reviewRules.acceptThreshold) {
          acceptedAchievements.push(achievement)
          reviewsForAcceptedAchievements.push(...latestReviews)
        }
      }
    }

    // if the block is not the genesis block and has no achievements or transactions, skip it
    if (height != 0 && acceptedAchievements.length == 0 && transactions.length == 0) {
      return null
    }

    transactions.sort((a, b) => {
      const timeDiff = b.timestamp - a.timestamp
      if (timeDiff !== 0) return timeDiff
      return a.signature.localeCompare(b.signature)
    })

    transactions.forEach((t) => {
      t.blockHeight = height
    })
    acceptedAchievements.sort((a, b) => b.timestamp - a.timestamp)
    reviewsForAcceptedAchievements.sort((a, b) => b.timestamp - a.timestamp)

    const blockHeader: BlockHeader = {
      height,
      previousHash,
      accountsRoot: this.accounts.merkleRoot,
      transactionsRoot: MerkleTree.calculateRoot(transactions.map((t) => t.signature)),
      achievementsRoot: MerkleTree.calculateRoot(acceptedAchievements.map((a) => a.signature)),
      reviewsRoot: MerkleTree.calculateRoot(reviewsForAcceptedAchievements.map((r) => r.signature)),
      transactionsCount: transactions.length,
      achievementsCount: acceptedAchievements.length,
      reviewsCount: reviewsForAcceptedAchievements.length,
      timestamp: Date.now(),
      hash: "",
    }
    const block: Block = {
      header: blockHeader,
      transactions,
      achievements: acceptedAchievements,
      reviews: reviewsForAcceptedAchievements,
    }

    this.assignRewards(block)

    block.header.accountsRoot = this.accounts.merkleRoot

    block.header.hash = hashBlockHeader(block.header)

    return block
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
      this.awesomeComStatus = status

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
      log(`${status.phase} for block #${this.targetBlock} starts`)
    }
    this.awesomeComStatus = status
    this.emit("awesomecom.status.updated", status)
  }

  private async broadcastChainHead() {
    const chainHead = await this.createChainHead()
    // log("Broadcasting chain head:", chainHead)
    this.socket.emit("message.send", {
      from: this.identity.address,
      to: "*",
      room: this.allNodesRoom,
      type: MESSAGE_TYPE.CHAIN_HEAD,
      payload: chainHead,
      timestamp: Date.now(),
    })
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
        room: this.fullNodesRoom,
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
    if (this.newBlock) {
      this.socket.emit("message.send", {
        from: this.identity.address,
        to: "*",
        room: this.allNodesRoom,
        type: MESSAGE_TYPE.NEW_BLOCK,
        payload: this.newBlock,
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

  private formatDecimal(num: number): number {
    return parseFloat(num.toFixed(4))
  }
}
