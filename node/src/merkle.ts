import { sha256 } from "js-sha256"
import { keccak256 } from "js-sha3"

export interface MerkleProof {
  index: number
  hashes: string[]
}

export function calculateMerkleRoot(items: string[]): string {
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

export function generateMerkleProof(items: string[], target: string): MerkleProof | null {
  if (items.length === 0) {
    return null
  }
  const proof: MerkleProof = {
    index: items.indexOf(target),
    hashes: [],
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

export function verifyMerkleProof(root: string, item: string, proof: MerkleProof): boolean {
  if (!proof || proof.hashes.length === 0) {
    return sha256(item) === root
  }

  let index = proof.index
  let hash = sha256(item)

  for (const sibling of proof.hashes) {
    if (index % 2 === 0) {
      hash = sha256(hash + sibling)
    } else {
      hash = sha256(sibling + hash)
    }
    index = Math.floor(index / 2)
  }

  return hash === root
}

export class MerklePatriciaTrie {
  private root = keccak256("")

  public getRoot(): string {
    return this.root
  }

  public setBalance(address: string, balance: number): void {
    this.root = ""
  }
  public getBalance(address: string): number {
    return 0
  }
  public getProof(address: string): string[] {
    return []
  }

  public static verifyProof(root: string, address: string, balance: number, proof: string[]): boolean {
    return false
  }
}

if (require.main === module) {
  const items = ["a", "b", "c", "d", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
  const root = calculateMerkleRoot(items)

  const item = "a"
  const proof = generateMerkleProof(items, item)
  if (proof) {
    const verified = verifyMerkleProof(root, item, proof)
    console.log("Verified:", verified)
  }
}
