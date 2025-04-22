import { keccak256 } from "js-sha3"
import { generateMnemonic, mnemonicToSeedSync } from "bip39"
import { BIP32Factory, BIP32Interface } from "bip32"
import * as ecc from "tiny-secp256k1"
import { Buffer } from "buffer"

export class Wallet {
  private keychain: BIP32Interface
  public publicKey: string

  constructor(mnemonic?: string, passphrase?: string) {
    if (!mnemonic) {
      mnemonic = generateMnemonic()
    }
    if (!passphrase) {
      passphrase = ""
    }
    const seed = mnemonicToSeedSync(mnemonic, passphrase)
    this.keychain = BIP32Factory(ecc).fromSeed(seed)
    this.publicKey = Buffer.from(this.keychain.publicKey).toString("hex")
  }

  public sign(hash: string): string {
    return Buffer.from(this.keychain.sign(Buffer.from(hash, "hex"))).toString("hex")
  }

  // Ethereum style address generation with custom derivation path
  // same as this swift code
  // let key = wallet.getKey(coin: .ethereum, derivationPath: "m/44\'/777\'/0\'/0/0")
  // let address = CoinType.ethereum.deriveAddress(privateKey: key)
  public derieveAddress() {
    const derivationPath = `m/44'/777'/0'/0/0`
    const chainKey = this.keychain.derivePath(derivationPath)

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
}
