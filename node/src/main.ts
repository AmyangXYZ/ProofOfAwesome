import { AwesomeNode } from "./node"

if (require.main === module) {
  const node = new AwesomeNode("https://connect.proof-of-awesome.app", "AwesomeNode-1", "full")
  node.start()
}
