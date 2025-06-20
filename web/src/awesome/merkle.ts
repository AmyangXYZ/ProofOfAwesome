import { sha256 } from "js-sha256"
import { Account } from "./awesome"

export interface MerkleProof {
  item: string
  hashes: string[]
  target: string
  index: number
}

export class MerkleTree {
  private constructor() {}

  public static calculateRoot(items: string[]): string {
    if (items.length === 0) {
      return sha256("")
    }

    if (items.length === 1) {
      return sha256(items[0])
    }

    let hashes = items.map((item) => sha256(item))

    while (hashes.length > 1) {
      const nextLevel: string[] = []

      for (let i = 0; i < hashes.length; i += 2) {
        if (i + 1 < hashes.length) {
          nextLevel.push(sha256(hashes[i] + hashes[i + 1]))
        } else {
          nextLevel.push(sha256(hashes[i] + hashes[i]))
        }
      }
      hashes = nextLevel
    }

    return hashes[0]
  }

  public static generateProof(item: string, items: string[], target: string): MerkleProof | null {
    if (items.length === 0) {
      return null
    }
    const proof: MerkleProof = {
      item,
      hashes: [],
      target,
      index: items.indexOf(item),
    }
    if (proof.index === -1) {
      return null
    }
    let index = proof.index
    let hashes = items.map((item) => sha256(item))

    while (hashes.length > 1) {
      const siblingIndex = index % 2 === 0 ? index + 1 : index - 1

      if (siblingIndex < hashes.length && siblingIndex >= 0) {
        proof.hashes.push(hashes[siblingIndex])
      } else {
        proof.hashes.push(hashes[index])
      }

      const nextLevel: string[] = []
      for (let i = 0; i < hashes.length; i += 2) {
        if (i + 1 < hashes.length) {
          nextLevel.push(sha256(hashes[i] + hashes[i + 1]))
        } else {
          nextLevel.push(sha256(hashes[i] + hashes[i]))
        }
      }

      hashes = nextLevel
      index = Math.floor(index / 2)
    }
    return proof
  }

  public static verifyProof(proof: MerkleProof): boolean {
    if (!proof || proof.hashes.length === 0) {
      return sha256(proof.item) === proof.target
    }

    let index = proof.index
    let hash = sha256(proof.item)

    for (const sibling of proof.hashes) {
      if (index % 2 === 0) {
        hash = sha256(hash + sibling)
      } else {
        hash = sha256(sibling + hash)
      }
      index = Math.floor(index / 2)
    }

    return hash === proof.target
  }
}

interface SMTNode {
  hash: string
  account?: Account
  left?: SMTNode
  right?: SMTNode
}

export type SparseMerkleProof = string[]

// for account storage and verification
export class SparseMerkleTree {
  private root: SMTNode
  private static defaultHash: string = sha256("")
  private static defaultHashSymbol: string = "."

  constructor() {
    this.root = { hash: SparseMerkleTree.defaultHash }
  }

  get merkleRoot(): string {
    return this.root.hash
  }

  public insert(account: Account) {
    if (!account.address.startsWith("0x") || account.address.length !== 42) {
      return
    }
    const addressBits = SparseMerkleTree.hexToBits(account.address.slice(2))
    let node = this.root
    const path: SMTNode[] = [node]
    for (const bit of addressBits) {
      if (bit === "0") {
        if (!node.left) {
          node.left = { hash: SparseMerkleTree.defaultHash }
        }
        node = node.left
      } else {
        if (!node.right) {
          node.right = { hash: SparseMerkleTree.defaultHash }
        }
        node = node.right
      }
      path.push(node)
    }
    node.account = account
    node.hash = sha256(
      [
        node.account.name,
        node.account.address,
        node.account.balance.toString(),
        node.account.nonce.toString(),
        node.account.acceptedAchievements.toString(),
        node.account.includedReviews.toString(),
      ].join("_")
    )

    for (let i = path.length - 2; i >= 0; i--) {
      const current = path[i]
      const leftHash = current.left?.hash ?? SparseMerkleTree.defaultHash
      const rightHash = current.right?.hash ?? SparseMerkleTree.defaultHash
      current.hash = sha256(leftHash + rightHash)
    }
  }

  public get(address: string): { account: Account | null; proof: SparseMerkleProof } {
    if (!address.startsWith("0x") || address.length !== 42) {
      return { account: null, proof: [] }
    }
    const addressBits = SparseMerkleTree.hexToBits(address.slice(2))
    let node = this.root
    const proof: SparseMerkleProof = []
    for (const bit of addressBits) {
      if (bit === "0") {
        if (!node.left) {
          return { account: null, proof: [] }
        }
        proof.push(node.right?.hash ?? SparseMerkleTree.defaultHashSymbol)
        node = node.left
      } else {
        if (!node.right) {
          return { account: null, proof: [] }
        }
        proof.push(node.left?.hash ?? SparseMerkleTree.defaultHashSymbol)
        node = node.right
      }
    }
    return { account: node.account ?? null, proof: proof }
  }

  public getAllAccounts(): Account[] {
    const accounts: Account[] = []
    const traverse = (node: SMTNode) => {
      if (node.account) {
        accounts.push(node.account)
      }
      if (node.left) traverse(node.left)
      if (node.right) traverse(node.right)
    }
    traverse(this.root)
    return accounts
  }

  public static verifyProof(account: Account, proof: SparseMerkleProof, root: string): boolean {
    if (!account.address.startsWith("0x") || account.address.length !== 42 || proof.length !== 160) {
      return false
    }
    const addressBits = SparseMerkleTree.hexToBits(account.address.slice(2))

    let hash = sha256(
      [
        account.name,
        account.address,
        account.balance.toString(),
        account.nonce.toString(),
        account.acceptedAchievements.toString(),
        account.includedReviews.toString(),
      ].join("_")
    )
    for (let i = proof.length - 1; i >= 0; i--) {
      if (addressBits[i] === "0") {
        hash = sha256(
          hash + (proof[i] === SparseMerkleTree.defaultHashSymbol ? SparseMerkleTree.defaultHash : proof[i])
        )
      } else {
        hash = sha256(
          (proof[i] === SparseMerkleTree.defaultHashSymbol ? SparseMerkleTree.defaultHash : proof[i]) + hash
        )
      }
    }

    return hash === root
  }

  private static hexToBits(hex: string): string {
    return hex
      .split("")
      .map((char) => parseInt(char, 16).toString(2).padStart(4, "0"))
      .join("")
  }
}

export function isMerkleProof(proof: unknown): proof is MerkleProof {
  return typeof proof === "object" && proof !== null && "index" in proof && "hashes" in proof
}
export function isSparseMerkleProof(proof: unknown): proof is SparseMerkleProof {
  return Array.isArray(proof) && proof.every((item) => typeof item === "string")
}

if (require.main === module) {
  const tree = new SparseMerkleTree()
  const address = "0x1234567890123456789012345678901234567890"
  tree.insert({
    name: "test",
    address,
    balance: 100,
    nonce: 0,
    acceptedAchievements: 0,
    includedReviews: 0,
  })
  console.log(tree.get(address))
  const { account, proof } = tree.get(address)
  if (!account) {
    console.log("No account found")
  } else {
    console.log(SparseMerkleTree.verifyProof(account, proof, tree.merkleRoot))
  }
}
