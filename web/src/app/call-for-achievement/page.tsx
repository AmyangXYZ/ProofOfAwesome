import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CallForAchievement() {
  return (
    <div className="max-w-5xl p-4 mx-auto">
      <header className="mb-8 text-center">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-3xl">Call for Achievements</h1>
      </header>

      <div className="mt-2 mb-4">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 ml-2">Abstract</h4>

        <Card className="bg-transparent py-4">
          <CardContent>
            <p>
              Proof of Awesome presents a novel blockchain consensus mechanism that replaces computational puzzles with
              real-world achievements through AI-assisted scholarly peer review. As a truly distributed blockchain, it&apos;s
              completely free to participate - anyone can host a full node, submit achievements, or contribute as a reviewer
              without any barriers.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2 mb-4">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 ml-2">Mining with Achievements</h4>

        <Card className="bg-transparent py-4">
          <CardContent>
            <p>
              Traditional blockchain mining systems, while technically impressive, remain abstract for most individuals.
              Mining through real-world achievements offers a complementary approach that brings blockchain into
              everyday life. Each validated achievement becomes a permanent record of human accomplishment, creating
              value through both network security and meaningful social recognition.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-transparent py-4 gap-2">
                <CardHeader>
                  <CardTitle>
                    <h4 className="text-blue-400 font-semibold">Fitness King</h4>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">&quot;First marathon done! Every mile counts, every step validated.&quot;</p>
                </CardContent>
              </Card>

              <Card className="bg-transparent py-4 gap-2">
                <CardHeader>
                  <CardTitle>
                    <h4 className="text-blue-400 font-semibold">Pro Player</h4>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    &quot;GGEZ, team too heavy. Go check the chain to see who&apos;s the real carry.&quot;
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-transparent py-4 gap-2">
                <CardHeader>
                  <CardTitle>
                    <h4 className="text-blue-400 font-semibold">Home Hero</h4>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    &quot;Now she can&apos;t say I&apos;m only gaming and left all the cleaning to her.&quot;
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2 mb-4">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 ml-2">Consensus and AwesomeCom</h4>

        <Card className="bg-transparent py-4">
          <CardContent>
            <p className="mb-4">
              Inspired by academic peer review, the consensus mechanism operates through a Technical Program Committee
              (TPC) comprising qualified community members and AI agents as reviewers. Achievements are validated for
              blockchain integration upon receiving at least three independent reviews with a median score exceeding
              [Weak-Accept].
            </p>
            <p>
              AwesomeCom implements this system through periodic blockchain events, each with precisely timed phases
              synchronized to a hard-coded genesis time of March 14, 2025, when this project was first envisioned. Every
              node in the network calculates its current phase based on the time elapsed since genesis, ensuring
              deterministic phase transitions across the entire network. When an achievement is accepted, it becomes a
              permanent part of the blockchain with eternal recognition in the
              network&apos;s history. The system rewards participants with AwesomeCoins: <span className="text-orange-400 font-semibold">authors earn 5 AwesomeCoins</span> for each accepted achievement, while <span className="text-orange-400 font-semibold">reviewers get 1 AwesomeCoin</span> for each review that helps an achievement get accepted.
            </p>
            <blockquote className="mt-6 border-l-4 pl-4">
              <h4 className="font-semibold text-blue-400 mb-2">The Four Phases in AwesomeCom</h4>
              <ul className="list-none pl-4 mt-2 space-y-2 text-sm">
                <li className="flex items-start items-center">
                  <span className="bg-neutral-800 px-2 rounded mr-2 font-medium">120s</span>
                  <span className="">Achievement Submission</span>
                </li>
                <li className="flex items-start items-center">
                  <span className="bg-neutral-800 px-2 rounded mr-2 font-medium">30s</span>
                  <span className="">Peer Review</span>
                </li>
                <li className="flex items-start items-center">
                  <span className="bg-neutral-800 px-2 rounded mr-2 font-medium">20s</span>
                  <span className="">TPC Meeting and Consensus</span>
                </li>
                <li className="flex items-start items-center">
                  <span className="bg-neutral-800 px-2 rounded mr-2 font-medium">10s</span>
                  <span className="">New Block Announcement</span>
                </li>
              </ul>
            </blockquote>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2 mb-4">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 ml-2">Network Architecture</h4>

        <Card className="bg-transparent py-4">
          <CardContent>
            <p>
              Peer-to-peer communication is achieved through a Socket.IO-based relay system, AwesomeConnect, connecting
              full nodes that maintain blockchain history with light nodes that need verified data. Full nodes serve
              this data through Merkle Patricia Trees and participate in the TPC to reach consensus, with some providing
              automated reviews through AI models. Light nodes focus on achievement submission and review, fetching
              verified chain data as needed.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-transparent py-4 gap-2">
                <CardHeader>
                  <CardTitle>
                    <h4 className="text-blue-400 font-semibold">AwesomeConnect</h4>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    <li>• Socket.IO-based relay</li>
                    <li>• Enable P2P and node discovery</li>
                    <li>• Independent of chain state</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-transparent py-4 gap-2">
                <CardHeader>
                  <CardTitle>
                    <h4 className="text-blue-400 font-semibold">Full Node</h4>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    <li>• Backend service nodes</li>
                    <li>• AI-assisted reviewer</li>
                    <li>• Complete chain history</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-transparent py-4 gap-2">
                <CardHeader>
                  <CardTitle>
                    <h4 className="text-blue-400 font-semibold">Light Node</h4>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    <li>• Client-side applications</li>
                    <li>• Achievement creator</li>
                    <li>• Fetch data as needed</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2 mb-4">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 ml-2">Scope</h4>

        <Card className="bg-transparent py-4">
          <CardContent>
            <p>
              Proof of Awesome is a self-contained blockchain system that operates independently. It does not involve
              any cryptocurrency, and is not connected to or integrated with other blockchain networks. The system is
              designed specifically for tracking and verifying real-world achievements through its own unique consensus
              mechanism.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
