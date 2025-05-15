import OpenAI from "openai"
import { AwesomeNode } from "./node"
import { AIReviewer } from "./reviewer_ai"
import { MongoDBRepository } from "./repository_mongodb"

const node = new AwesomeNode(
  "https://connect.proof-of-awesome.app",
  process.env.NODE_NAME || "Full Node",
  process.env.MNEMONIC || "",
  process.env.PASSPHRASE || "",
  new MongoDBRepository(
    `mongodb://admin:password123@mongodb:27017/awesome_${process.env.NODE_NAME?.replaceAll(" ", "_")}?authSource=admin`
  ),
  // new MongoDBRepository(`mongodb://localhost:27017/awesome`),
  new AIReviewer(
    new OpenAI({
      apiKey: process.env.AI_API_KEY || "",
      baseURL: process.env.AI_API_BASE_URL || "https://api.openai.com/v1",
    }),
    process.env.AI_MODEL || "gpt-4o-mini",
    process.env.AI_MODEL_SUPPORT_IMAGE_INPUT === "true"
  )
)
node.start()
