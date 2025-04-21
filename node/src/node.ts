import { io, Socket } from "socket.io-client"
import { keccak256 } from "js-sha3"
import { generateMnemonic, mnemonicToSeedSync } from "bip39"
import { BIP32Factory, BIP32Interface } from "bip32"
import * as ecc from "tiny-secp256k1"
import { Buffer } from "buffer"
import { sha256 } from "js-sha256"
import { ClientEvents, Identity, Message, ServerEvents, AwesomeComStatus, Block, Chain, MESSAGE_TYPE } from "./types"

export class AwesomeNode {
  public readonly chain: Chain = {
    name: "AwesomeCom-0.0.1",
    genesisTime: 0,
    awesomeComPeriod: 15 * 60 * 1000,
    achievementSubmissionWindow: [0, 8 * 60 * 1000],
    achievementReviewWindow: [8 * 60 * 1000, 12 * 60 * 1000],
    blockCreationWindow: [12 * 60 * 1000, 14 * 60 * 1000],
    blockAnnouncementWindow: [14 * 60 * 1000, 15 * 60 * 1000],
  }
  public awesomeComStatus: AwesomeComStatus = {
    edition: 0,
    theme: "",
    phase: "submission",
    phaseRemaining: 0,
  }
  public blocks: Block[] = []

  private statusUpdateInterval: NodeJS.Timeout | null = null
  private socket: Socket<ClientEvents, ServerEvents>
  private wallet: BIP32Interface
  private publicKey: string
  private identity: Identity

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

    this.socket = io(connectAddress)
    this.setupSocket()
  }

  setupSocket() {
    this.socket.on("connect", async () => {
      this.socket.emit("node.connect", this.identity)
    })

    this.socket.on("node.connected", () => {
      console.log("Connected to AwesomeConnect")
      this.socket.emit("room.get_members", `${this.chain.name}:fullnodes`)
    })

    this.socket.on("message.received", (message: Message) => {
      this.handleMessage(message)
    })

    this.socket.on("room.members", (room: string, members: Identity[]) => {
      console.log(`Room [${room}] members: ${members.length}`)
      if (room === `${this.chain.name}:fullnodes`) {
        if (members.length == 1 && members[0].address === this.identity.address) {
          if (this.identity.nodeType === "full") {
            console.log("First node in the chain, initializing the chain")
            this.chain.genesisTime = Date.now()
            this.startStatusUpdates()
          }
        } else {
          this.socket.emit("message.send", {
            from: this.identity.address,
            to: members[0].address,
            room: "",
            type: MESSAGE_TYPE.GET_CHAIN_HEAD,
            payload: {},
            timestamp: Date.now(),
            hash: "",
          } satisfies Message)
        }
      }
    })
  }

  private startStatusUpdates() {
    this.updateAwesomeComStatus()
    console.log(
      `[${this.awesomeComStatus.edition}th AwesomeCom] Phase "${this.awesomeComStatus.phase}" (${Math.floor(this.awesomeComStatus.phaseRemaining / 1000)}s remaining)`
    )
    this.statusUpdateInterval = setInterval(() => {
      this.updateAwesomeComStatus()
    }, 1000)
  }

  updateAwesomeComStatus() {
    const now = Date.now()
    const timeSinceGenesis = now - this.chain.genesisTime
    this.awesomeComStatus.edition = Math.floor(timeSinceGenesis / this.chain.awesomeComPeriod)
    const elapsed = timeSinceGenesis % this.chain.awesomeComPeriod
    const windows = [
      { name: "Achievement Submission", window: this.chain.achievementSubmissionWindow },
      { name: "Achievement Review", window: this.chain.achievementReviewWindow },
      { name: "Block Creation", window: this.chain.blockCreationWindow },
      { name: "Block Announcement", window: this.chain.blockAnnouncementWindow },
    ]

    const currentPhase = windows.find(({ window: [start, end] }) => elapsed >= start && elapsed < end)
    if (currentPhase) {
      if (this.awesomeComStatus.phase !== currentPhase.name) {
        console.log(
          `[${this.awesomeComStatus.edition}th AwesomeCom] Entering phase "${currentPhase.name}" (${Math.floor(currentPhase.window[1] - elapsed) / 1000}s remaining)`
        )
      }
      this.awesomeComStatus.phase = currentPhase.name
      this.awesomeComStatus.phaseRemaining = currentPhase.window[1] - elapsed
    }
  }

  handleMessage(message: Message) {
    switch (message.type) {
      case MESSAGE_TYPE.NEW_TRANSACTION:
        console.log("New transaction:", message.payload)
        break
      case MESSAGE_TYPE.NEW_BLOCK:
        console.log("New block:", message.payload)
        break
      case MESSAGE_TYPE.NEW_ACHIEVEMENT:
        console.log("New achievement:", message.payload)
        break
      case MESSAGE_TYPE.GET_CHAIN_HEAD:
        if (this.identity.nodeType !== "full") {
          break
        }
        console.log("Get chain head request from:", message.from)
        break
      default:
        console.log("Unknown message type:", message.type)
        break
    }
  }

  // Ethereum style address generation with custom derivation path
  // same as this swift code
  // let key = wallet.getKey(coin: .ethereum, derivationPath: "m/44\'/777\'/0\'/0/0")
  // let address = CoinType.ethereum.deriveAddress(privateKey: key)
  generateAddress() {
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

  cleanup() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval)
    }
  }
}
