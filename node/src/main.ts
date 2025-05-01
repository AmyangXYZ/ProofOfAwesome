import OpenAI from "openai"
import { AwesomeNode } from "./node"
import { AI_API_KEYS } from "./ai_api_keys"
import { AIReviewer } from "./reviewer_ai"
import { MongoDBRepository } from "./repository_mongodb"

const node = new AwesomeNode(
  "https://connect.proof-of-awesome.app",
  "Full Node w/ GPT-4o Mini",
  "",
  "",
  new MongoDBRepository("mongodb://localhost:27017/awesome"),
  new AIReviewer(
    new OpenAI({
      apiKey: AI_API_KEYS.OPENAI,
    }),
    "gpt-4o-mini",
    true
  )
)
node.start()
