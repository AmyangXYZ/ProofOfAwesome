import { io, Socket } from "socket.io-client"
import { keccak256 } from "js-sha3"
import { generateMnemonic, mnemonicToSeedSync } from "bip39"
import { BIP32Factory, BIP32Interface } from "bip32"
import * as ecc from "tiny-secp256k1"
import { Buffer } from "buffer"
import { sha256 } from "js-sha256"
import {
  ClientEvents,
  Identity,
  Message,
  ServerEvents,
  AwesomeComStatus,
  Block,
  Chain,
  MESSAGE_TYPE,
  Repository,
  Transaction,
  Achievement,
  Review,
  ChainHead,
  EventMap,
  AWESOME_COM_PHASE,
} from "./types"
import { MongoDBRepository } from "./repository_mongodb"

export class AwesomeNode {
  public readonly chain: Chain = {
    name: "AwesomeCom-0.0.1",
    genesisTime: 0,
    awesomeComPeriod: 15 * 60 * 1000,
    achievementSubmissionPhase: [0, 8 * 60 * 1000],
    achievementReviewPhase: [8 * 60 * 1000, 12 * 60 * 1000],
    blockCreationPhase: [12 * 60 * 1000, 14 * 60 * 1000],
    wrapUpPhase: [14 * 60 * 1000, 15 * 60 * 1000],
    themes: ["Life", "Gaming", "Fitness", "Home"],
  }
  public awesomeComStatus: AwesomeComStatus = {
    edition: 0,
    theme: "",
    phase: AWESOME_COM_PHASE.WRAP_UP,
    phaseRemaining: 0,
    editionRemaining: 0,
  }

  private statusUpdateInterval: NodeJS.Timeout | null = null
  private socket: Socket<ClientEvents, ServerEvents>
  private wallet: BIP32Interface
  private publicKey: string
  private identity: Identity
  private repository: Repository

  // created or received in the block creation phase
  private pendingBlock: Block | null = null

  private eventListeners: Map<keyof EventMap, Set<unknown>> = new Map()

  constructor(
    connectAddress: string,
    name: string,
    nodeType: "light" | "full",
    mnemonic?: string,
    passphrase?: string
  ) {
    if (!mnemonic) {
      mnemonic = generateMnemonic()
    }
    if (!passphrase) {
      passphrase = ""
    }
    const seed = mnemonicToSeedSync(mnemonic, passphrase)
    this.wallet = BIP32Factory(ecc).fromSeed(seed)
    this.publicKey = Buffer.from(this.wallet.publicKey).toString("hex")

    this.identity = {
      chain: this.chain.name,
      name,
      address: this.generateAddress(),
      nodeType,
      publicKey: this.publicKey,
      signature: "",
    }

    this.identity.signature = Buffer.from(
      this.wallet.sign(
        Buffer.from(
          sha256(
            [
              this.identity.chain,
              this.identity.name,
              this.identity.address,
              this.identity.nodeType,
              this.identity.publicKey,
            ].join("_")
          ),
          "hex"
        )
      )
    ).toString("hex")

    console.log("Created identity:", this.identity)

    this.repository = new MongoDBRepository("mongodb://localhost:27017/awesome")

    this.socket = io(connectAddress, { autoConnect: false })
    this.setupSocket()
    // this.on("phase.changed", (status: AwesomeComStatus) => {})
  }

  async start() {
    await this.repository.init()
    this.socket.connect()

    this.on("awesome_com.block_creation.started", async () => {
      this.pendingBlock = null
      if (this.identity.nodeType == "full") {
        this.pendingBlock = await this.createBlock()
        this.socket.emit("message.send", {
          from: this.identity.address,
          to: "*",
          room: `${this.chain.name}:nodes`,
          type: MESSAGE_TYPE.BLOCK,
          payload: this.pendingBlock,
          timestamp: Date.now(),
        })
      }
    })
    this.on("awesome_com.wrap_up.started", async () => {
      if (this.pendingBlock) {
        await this.repository.addBlock(this.pendingBlock)
        this.emit("block.added", this.pendingBlock)
        this.pendingBlock = null
      }
    })
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
      this.socket.emit("room.get_members", `${this.chain.name}:fullnodes`)
    })

    this.socket.on("message.received", (message: Message) => {
      this.handleMessage(message)
    })

    this.socket.on("room.members", async (room: string, members: Identity[]) => {
      console.log(`Room [${room}] members: ${members.length}`)
      if (room === `${this.chain.name}:fullnodes`) {
        if (members.length == 1 && members[0].address === this.identity.address) {
          if (this.identity.nodeType === "full") {
            console.log("First node in the chain, initializing the chain")
            this.chain.genesisTime = Date.now()
            this.startStatusUpdates()
          }
        } else {
          const msg: Message = {
            from: this.identity.address,
            to: members[0].address,
            type: MESSAGE_TYPE.GET_CHAIN_HEAD,
            payload: {},
            timestamp: Date.now(),
          }
          this.socket.emit("message.send", msg)
        }
      }
    })
  }

  getTheme(edition: number) {
    const hash = sha256(edition.toString())
    const themeIndex = parseInt(hash.substring(0, 8), 16) % this.chain.themes.length
    return this.chain.themes[themeIndex]
  }

  private startStatusUpdates() {
    this.updateAwesomeComStatus()
    this.statusUpdateInterval = setInterval(() => {
      this.updateAwesomeComStatus()
    }, 1000)
  }

  private updateAwesomeComStatus() {
    const now = Date.now()
    const timeSinceGenesis = now - this.chain.genesisTime
    const edition = Math.floor(timeSinceGenesis / this.chain.awesomeComPeriod)
    this.awesomeComStatus.editionRemaining =
      this.chain.awesomeComPeriod - (timeSinceGenesis % this.chain.awesomeComPeriod)

    if (edition == 0 || edition !== this.awesomeComStatus.edition) {
      this.awesomeComStatus.edition = edition
      this.awesomeComStatus.theme = this.getTheme(edition)
    }

    const elapsed = timeSinceGenesis % this.chain.awesomeComPeriod
    const phases = [
      { phase: AWESOME_COM_PHASE.ACHIEVEMENT_SUBMISSION, window: this.chain.achievementSubmissionPhase },
      { phase: AWESOME_COM_PHASE.ACHIEVEMENT_REVIEW, window: this.chain.achievementReviewPhase },
      { phase: AWESOME_COM_PHASE.BLOCK_CREATION, window: this.chain.blockCreationPhase },
      { phase: AWESOME_COM_PHASE.WRAP_UP, window: this.chain.wrapUpPhase },
    ]
    const currentPhase = phases.find(({ window: [start, end] }) => elapsed >= start && elapsed < end)

    if (currentPhase) {
      if (this.awesomeComStatus.phase !== currentPhase.phase) {
        this.awesomeComStatus.phase = currentPhase.phase
        console.log(`[${edition}th-AwesomeCom] Entering ${currentPhase.phase} phase `)
        switch (currentPhase.phase) {
          case AWESOME_COM_PHASE.ACHIEVEMENT_SUBMISSION:
            this.emit("awesome_com.achievement_submission.started", undefined)
            break
          case AWESOME_COM_PHASE.ACHIEVEMENT_REVIEW:
            this.emit("awesome_com.achievement_review.started", undefined)
            break
          case AWESOME_COM_PHASE.BLOCK_CREATION:
            this.emit("awesome_com.block_creation.started", undefined)
            break
          case AWESOME_COM_PHASE.WRAP_UP:
            this.emit("awesome_com.wrap_up.started", undefined)
            break
        }
      }
      const newRemaining = currentPhase.window[1] - elapsed
      if (Math.abs(this.awesomeComStatus.phaseRemaining - newRemaining) >= 1000) {
        this.awesomeComStatus.phaseRemaining = newRemaining
      }
    }

    this.emit("awesome_com.status.updated", { ...this.awesomeComStatus })
  }

  private handleMessage(message: Message) {
    switch (message.type) {
      case MESSAGE_TYPE.CHAIN_HEAD:
        console.log("Chain head:", message.payload)
        break
      case MESSAGE_TYPE.TRANSACTION:
        console.log("New transaction:", message.payload)
        break
      case MESSAGE_TYPE.BLOCK:
        console.log("New block:", message.payload)
        break
      case MESSAGE_TYPE.ACHIEVEMENT:
        console.log("New achievement:", message.payload)
        break
      case MESSAGE_TYPE.REVIEW:
        console.log("New review:", message.payload)
        break
      case MESSAGE_TYPE.GET_CHAIN_HEAD:
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
        name: this.chain.name,
        latestBlockHeight: block.height,
        latestBlockHash: block.hash,
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

  private async createBlock(): Promise<Block> {
    const edition = this.awesomeComStatus.edition
    let previousHash = ""
    let previousHeight = 0
    const transactions = await this.repository.getPendingTransactions()
    const achievements = await this.repository.getAchievementsByEdition(edition)
    const reviews = await this.repository.getReviewsByEdition(edition)
    const previousBlock = await this.repository.getLatestBlock()
    if (previousBlock) {
      previousHash = previousBlock.hash
      previousHeight = previousBlock.height
    }

    const block: Block = {
      height: previousHeight + 1,
      previousHash,
      transactions,
      transactionsMerkleRoot: this.computeMerkleRoot(transactions.map((t) => t.signature)),
      achievements,
      achievementsMerkleRoot: this.computeMerkleRoot(achievements.map((a) => a.signature)),
      reviews,
      reviewsMerkleRoot: this.computeMerkleRoot(reviews.map((r) => r.signature)),
      creatorAddress: this.identity.address,
      timestamp: Date.now(),
      hash: "",
    }
    block.hash = this.computeBlockHash(block)

    return block
  }

  private computeBlockHash(block: Block) {
    const hash = sha256(
      [
        block.previousHash,
        block.transactionsMerkleRoot,
        block.achievementsMerkleRoot,
        block.reviewsMerkleRoot,
        block.creatorAddress,
        block.timestamp,
      ].join("_")
    )
    return hash
  }

  private verifyBlock(block: Block) {
    return this.computeBlockHash(block) === block.hash
  }

  private verifyTransaction(transaction: Transaction) {
    const hash = sha256(
      [
        transaction.senderAddress,
        transaction.recipientAddress,
        transaction.amount,
        transaction.timestamp,
        transaction.senderPublicKey,
      ].join("_")
    )

    return ecc.verify(
      Buffer.from(hash, "hex"),
      Buffer.from(transaction.senderPublicKey, "hex"),
      Buffer.from(transaction.signature, "hex")
    )
  }

  private verifyAchievement(achievement: Achievement) {
    const hash = sha256(
      [
        achievement.creatorName,
        achievement.creatorAddress,
        achievement.title,
        achievement.description,
        achievement.attachments.join(","),
        achievement.timestamp,
        achievement.creatorPublicKey,
      ].join("_")
    )

    return ecc.verify(
      Buffer.from(hash, "hex"),
      Buffer.from(achievement.creatorPublicKey, "hex"),
      Buffer.from(achievement.signature, "hex")
    )
  }

  private verifyReview(review: Review) {
    const hash = sha256(
      [
        review.achievementSignature,
        review.reviewerName,
        review.reviewerAddress,
        review.score,
        review.comment,
        review.timestamp,
        review.reviewerPublicKey,
      ].join("_")
    )

    return ecc.verify(
      Buffer.from(hash, "hex"),
      Buffer.from(review.reviewerPublicKey, "hex"),
      Buffer.from(review.signature, "hex")
    )
  }

  private computeMerkleRoot(items: string[]): string {
    if (items.length === 0) {
      return sha256("")
    }

    let hashes = items.map((item) => sha256(item))

    while (hashes.length > 1) {
      const newLevel: string[] = []

      for (let i = 0; i < hashes.length; i += 2) {
        if (i + 1 < hashes.length) {
          const combined = hashes[i] + hashes[i + 1]
          const hash = sha256(combined)
          newLevel.push(hash)
        } else {
          newLevel.push(hashes[i])
        }
      }

      hashes = newLevel
    }

    return hashes[0]
  }

  // Ethereum style address generation with custom derivation path
  // same as this swift code
  // let key = wallet.getKey(coin: .ethereum, derivationPath: "m/44\'/777\'/0\'/0/0")
  // let address = CoinType.ethereum.deriveAddress(privateKey: key)
  private generateAddress() {
    const derivationPath = `m/44'/777'/0'/0/0`
    const chainKey = this.wallet.derivePath(derivationPath)

    const privateKey = chainKey.privateKey
    if (!privateKey) throw new Error("Could not generate private key for chain")
    const publicKeyFromPrivate = ecc.pointFromScalar(privateKey, false)
    if (!publicKeyFromPrivate) throw new Error("Could not generate public key from private key")

    const pubKeyWithoutPrefix = Buffer.from(publicKeyFromPrivate).subarray(1)

    const address = keccak256(pubKeyWithoutPrefix).slice(-40)
    const hash = keccak256(address)
    let checksumAddress = "0x"

    for (let i = 0; i < address.length; i++) {
      checksumAddress += parseInt(hash[i], 16) >= 8 ? address[i].toUpperCase() : address[i]
    }
    return checksumAddress
  }

  private cleanup() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval)
    }
  }
}
