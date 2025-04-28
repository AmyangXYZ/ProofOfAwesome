import Banner from "@/components/Banner"

export default function CallForAchievementsView() {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2 text-blue-900">AwesomeCom • Call for Achievements</h1>
        <Banner />
      </header>

      <div className="mt-2 mb-4">
        <div className="flex items-center justify-between cursor-pointer p-2">
          <h2 className="text-xl font-bold text-slate-800">Abstract</h2>
        </div>

        <div className="bg-white px-6 py-4 border border-slate-200 rounded-lg shadow-sm mt-2 font-sans">
          <p className="leading-relaxed text-slate-700">
            Proof of Awesome presents a novel blockchain consensus mechanism that replaces computational puzzles with
            real-world achievements. This system combines AI-assisted scholarly peer review with blockchain technology
            to create verifiable digital assets from personal accomplishments.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between cursor-pointer p-2">
          <h2 className="text-xl font-bold text-slate-800">Mining with Achievements</h2>
        </div>

        <div className="bg-white px-6 py-4 border border-slate-200 rounded-lg shadow-sm mt-2 font-sans">
          <p className="leading-relaxed text-slate-700">
            Traditional blockchain mining systems, while technically impressive, remain abstract for most individuals.
            Mining through real-world achievements offers a complementary approach that brings blockchain into everyday
            life. Each validated achievement becomes a permanent record of human accomplishment, creating value through
            both network security and meaningful social recognition.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h5 className="font-semibold text-base mb-2 text-blue-800">Fitness King</h5>
              <p className="text-sm text-slate-600">
                &quot;First marathon done! Every mile counts, every step validated.&quot;
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h5 className="font-semibold text-base mb-2 text-blue-800">Pro Player</h5>
              <p className="text-sm text-slate-600">
                &quot;GGEZ, team too heavy. Go check the chain to see who&apos;s the real carry.&quot;
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h5 className="font-semibold text-base mb-2 text-blue-800">Home Hero</h5>
              <p className="text-sm text-slate-600">
                &quot;Now she can&apos;t say I&apos;m only playing games and left all the cleaning to her.&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between cursor-pointer p-2">
          <h2 className="text-xl font-bold text-slate-800">Consensus and AwesomeCom</h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm mt-2 overflow-hidden px-6 py-4">
          <article className="prose lg:prose-lg mx-auto">
            <p className="leading-relaxed text-slate-700 font-sans">
              Inspired by academic peer review, the consensus mechanism operates through a Technical Program Committee
              (TPC) comprising qualified community members and AI agents. Achievements are validated for blockchain
              integration upon receiving at least three independent reviews with a median score exceeding [Weak-Accept].
            </p>

            <p className="mt-2 leading-relaxed text-slate-700 font-sans">
              AwesomeCom brings this vision to life through periodic blockchain events, each with its own unique theme
              and precisely timed protocol. When an achievement is accepted, it becomes a permanent part of the
              blockchain, earning the creator AwesomeCoin rewards and eternal recognition in the network&apos;s history.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
              <h4 className="font-semibold text-blue-900 mb-2">The 8-4-2-1 Timed Protocol in AwesomeCom</h4>
              <ul className="list-none pl-5 mt-2 space-y-2">
                <li className="flex items-start">
                  <span className="bg-blue-100 px-2 rounded mr-2">8min</span>
                  <span>Achievement submission and TPC formation</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 px-2 rounded mr-2">4min</span>
                  <span>Peer review and validation</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 px-2 rounded mr-2">2min</span>
                  <span>TPC meeting and reach consensus</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 px-2 rounded mr-2">1min</span>
                  <span>Announcement of the new block</span>
                </li>
              </ul>
            </div>
          </article>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between cursor-pointer p-2">
          <h2 className="text-xl font-bold text-slate-800">Network Architecture</h2>
        </div>

        <div className="bg-white px-6 py-4 border border-slate-200 rounded-lg shadow-sm mt-2 font-sans">
          <p className="leading-relaxed text-slate-700">
            Peer-to-peer communication is achieved through a Socket.IO-based relay system, AwesomeConnect, connecting
            full nodes that maintain blockchain history with light nodes that need verified data. Full nodes serve this
            data through Merkle Patricia Trees and participate in the TPC to reach consensus, with some providing
            automated reviews through AI models. Light nodes focus on achievement submission and review, fetching
            verified chain data as needed.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h5 className="font-semibold text-base mb-2 text-blue-800">AwesomeConnect</h5>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Socket.IO-based relay</li>
                <li>• Enable P2P and node discovery</li>
                <li>• Independent of chain state</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h5 className="font-semibold text-base mb-2 text-blue-800">Full Nodes</h5>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Backend service nodes</li>
                <li>• AI-assisted reviewer</li>
                <li>• Complete chain history</li>
              </ul>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h5 className="font-semibold text-base mb-2 text-blue-800">Light Nodes</h5>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• Client-side applications</li>
                <li>• Achievement creator</li>
                <li>• Fetch data as needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 mb-4">
        <div className="flex items-center justify-between cursor-pointer p-2">
          <h2 className="text-xl font-bold text-slate-800">Scope</h2>
        </div>

        <div className="bg-white px-6 py-4 border border-slate-200 rounded-lg shadow-sm font-sans">
          <p className="leading-relaxed text-slate-700">
            Proof of Awesome is a self-contained blockchain system that operates independently. It does not involve any
            cryptocurrency, and is not connected to or integrated with other blockchain networks. The system is designed
            specifically for tracking and verifying real-world achievements through its own unique consensus mechanism.
          </p>
        </div>
      </div>
    </div>
  )
}
