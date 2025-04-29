import Banner from "@/components/banner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CallForAchievementsView() {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="mb-2 text-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Call for Achievements</h1>
        <Banner />
      </header>

      <div className="mt-2 mb-4">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 ml-2">Abstract</h4>

        <Card className="bg-transparent py-4">
          <CardContent>
            <p className="leading-relaxed">
              Proof of Awesome presents a novel blockchain consensus mechanism that replaces computational puzzles with
              real-world achievements. This system combines AI-assisted scholarly peer review with blockchain technology
              to create verifiable digital assets from personal accomplishments.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-2 mb-4">
        <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mb-4 ml-2">Mining with Achievements</h4>

        <Card className="bg-transparent py-4">
          <CardContent>
            <p className="leading-relaxed">
              Traditional blockchain mining systems, while technically impressive, remain abstract for most individuals.
              Mining through real-world achievements offers a complementary approach that brings blockchain into
              everyday life. Each validated achievement becomes a permanent record of human accomplishment, creating
              value through both network security and meaningful social recognition.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-transparent py-4 gap-2">
                <CardHeader>
                  <CardTitle>
                    <h4 className="text-blue-500 font-semibold">Fitness King</h4>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">&quot;First marathon done! Every mile counts, every step validated.&quot;</p>
                </CardContent>
              </Card>

              <Card className="bg-transparent py-4 gap-2">
                <CardHeader>
                  <CardTitle>
                    <h4 className="text-blue-500 font-semibold">Pro Player</h4>
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
                    <h4 className="text-blue-500 font-semibold">Home Hero</h4>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    &quot;Now she can&apos;t say I&apos;m only playing games and left all the cleaning to her.&quot;
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
            <p className="mb-4 leading-relaxed">
              Inspired by academic peer review, the consensus mechanism operates through a Technical Program Committee
              (TPC) comprising qualified community members and AI agents as reviewers. Achievements are validated for
              blockchain integration upon receiving at least three independent reviews with a median score exceeding
              [Weak-Accept].
            </p>
            <p className="leading-relaxed">
              AwesomeCom brings this vision to life through periodic blockchain events, each with its own unique theme
              and precisely timed phases. When an achievement is accepted, it becomes a permanent part of the
              blockchain, earning the creator AwesomeCoin rewards and eternal recognition in the network&apos;s history.
            </p>
            <blockquote className="mt-6 border-l-4 pl-6">
              <h4 className="font-semibold text-blue-500 mb-2 ">The Four Phases in AwesomeCom</h4>
              <ul className="list-none pl-5 mt-2 space-y-2">
                <li className="flex items-start">
                  <span className="bg-blue-950 px-2 rounded mr-2 font-semibold">90s</span>
                  <span className="font-semibold mr-2">Submission: </span>
                  <span>submit achievements and get quick AI reviews</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-950 px-2 rounded mr-2 font-semibold">60s</span>
                  <span className="font-semibold mr-2">Review: </span>
                  <span>human peer review and challenge</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-950 px-2 rounded mr-2 font-semibold">20s</span>
                  <span className="font-semibold mr-2">Consensus: </span>
                  <span>TPC members reach consensus on the accepted achievements and create the block</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-950 px-2 rounded mr-2 font-semibold">10s</span>
                  <span className="font-semibold mr-2">Announcement: </span>
                  <span>TPC announces the new block and prepares for the next round</span>
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
            <p className="leading-relaxed">
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
                    <h4 className="text-blue-500 font-semibold">AwesomeConnect</h4>
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
                    <h4 className="text-blue-500 font-semibold">Full Node</h4>
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
                    <h4 className="text-blue-500 font-semibold">Light Node</h4>
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
            <p className="leading-relaxed">
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
