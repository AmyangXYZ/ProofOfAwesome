import { useEffect, useState } from "react"

export default function CallForAchievementsView() {
  const [awesomeComStatus, setAwesomeComStatus] = useState({
    edition: 42,
    theme: "Computational Fitness",
    phase: "Achievement Submission",
    phaseRemaining: 285000,
    editionRemaining: 485000,
  })

  // Simulate countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setAwesomeComStatus((prev) => ({
        ...prev,
        phaseRemaining: Math.max(0, prev.phaseRemaining - 1000),
        editionRemaining: Math.max(0, prev.editionRemaining - 1000),
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-8">
      <header className="mb-4 text-center">
        <h1 className="text-3xl font-bold mb-1">Call for Achievements</h1>
        {/* <p className="font-medium text-blue-800 mb-1">
          The {awesomeComStatus.edition}th edition of AwesomeCom is in the {awesomeComStatus.phase} phase
        </p> */}
        {/* <p className="text-blue-800 font-medium">
          Edition #{awesomeComStatus.edition} • {awesomeComStatus.theme}
        </p>
        <div className="mt-2 text-sm text-slate-500 font-sans">April 23, 2025</div> */}
      </header>

      <div className="mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start font-sans">
          <div className="flex-shrink-0 text-blue-500 mr-3 mt-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div>
            <h3 className="text-lg text-blue-800 mb-1 font-serif">
              The {awesomeComStatus.edition}th edition of AwesomeCom is in the progress
            </h3>
            <p className="text-sm mb-1">
              Theme: <span className="font-mono text-blue-800">{awesomeComStatus.theme}</span> • Phase:{" "}
              <span className="font-mono text-blue-800">{awesomeComStatus.phase}</span> • Remaining:{" "}
              <span className="font-mono text-blue-800">
                {Math.floor(awesomeComStatus.editionRemaining / 60000)}m{" "}
                {Math.floor((awesomeComStatus.editionRemaining % 60000) / 1000)}s
              </span>
            </p>
            <p className="text-sm mb-1">
              <span
                className="underline cursor-pointer hover:text-blue-600 transition-colors duration-200"
                onClick={() => console.log("Connect wallet clicked")}
              >
                Connect your wallet
              </span>{" "}
              to participate now!
            </p>
          </div>
        </div>
      </div>

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
            Traditional blockchain mining systems, while technically impressive and mathematically elegant, remain
            abstract for most individuals. Mining through real-world achievements offers a complementary approach that
            brings blockchain into everyday life. Each validated achievement not only contributes to network security
            but also creates lasting value by documenting human accomplishment.
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

            <p className="mt-4 leading-relaxed text-slate-700 font-sans">
              Achievement submission and validation occur in AwesomeCom, a periodic blockchain event with a precisely
              timed protocol and rotating themes. Accepted achievements are permanently recorded in the blockchain and
              awarded with AwesomeCoin, and bonus goes to the best achievement and quality reviews.
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
                  <span>TPC meeting and block creation</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 px-2 rounded mr-2">1min</span>
                  <span>Concluding remarks</span>
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
            data through Merkle Patricia Trees and participate in the Technical Program Committee (TPC) to reach
            consensus, with some providing automated reviews through AI models. Light nodes focus on achievement
            submission and review, fetching verified data as needed.
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
    </div>
  )
}
