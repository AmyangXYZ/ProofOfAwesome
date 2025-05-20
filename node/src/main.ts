import OpenAI from "openai"
import { AwesomeNode } from "./node"
import { AIReviewer } from "./reviewer_ai"
import { MongoDBRepository } from "./repository_mongodb"

let aiReviewer: AIReviewer | undefined
if (process.env.AI_MODEL && process.env.AI_API_KEY && process.env.AI_API_BASE_URL) {
  aiReviewer = new AIReviewer(
    new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_API_BASE_URL,
    }),
    process.env.AI_MODEL,
    process.env.AI_MODEL_SUPPORT_IMAGE_INPUT === "true"
  )
}

const node = new AwesomeNode(
  process.env.CONNECT_URL || "https://connect.proof-of-awesome.app",
  process.env.NODE_NAME || "Full Node",
  process.env.MNEMONIC || "",
  process.env.PASSPHRASE || "",
  new MongoDBRepository(process.env.MONGODB_URI || "mongodb://localhost:27017/awesome"),
  aiReviewer
)

node.start()
