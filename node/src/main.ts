import OpenAI from "openai"
import { AwesomeNode } from "./node"
import { AI_API_KEYS } from "./ai_api_keys"
import { AIReviewer } from "./reviewer_ai"
import { MongoDBRepository } from "./repository_mongodb"

const node = new AwesomeNode(
  "https://connect.proof-of-awesome.app",
  "AwesomeNode-1",
  "full",
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
node.on("peer.discovered", (peers) => {
  console.log(peers)
})
