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
        <h1 className="text-3xl font-bold mb-1">Proceedings of AwesomeCom</h1>
        <p className="text-blue-800 font-medium">
          Edition #{awesomeComStatus.edition} • {awesomeComStatus.theme}
        </p>
        <div className="mt-2 text-sm text-slate-500 font-sans">April 23, 2025</div>
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
            <h3 className="font-medium text-blue-800 mb-1">Current AwesomeCom Session</h3>
            <p className="text-sm text-slate-700">
              This AwesomeCom session on &quot;{awesomeComStatus.theme}&quot; is currently in the{" "}
              {awesomeComStatus.phase} phase. Participants are encouraged to contribute to the consensus process
              according to the current phase protocols.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2 mb-4">
        <div className="flex items-center justify-between cursor-pointer p-2">
          <h2 className="text-xl font-bold text-slate-800">Abstract</h2>
        </div>

        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm mt-2 font-sans">
          <p className="leading-relaxed text-slate-700">
            Proof of Awesome presents a novel blockchain consensus mechanism that replaces computational puzzles with
            validation of real-world achievements. This system combines AI-assisted scholarly peer review with
            blockchain technology to create verifiable digital assets from personal accomplishments. Each AwesomeCom
            session operates as a decentralized micro-conference where participants submit, review, and validate
            achievements within a specific thematic domain.
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between cursor-pointer p-2">
          <h2 className="text-xl font-bold text-slate-800">Mining with Achievements</h2>
        </div>

        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm mt-2 font-sans">
          <p className="leading-relaxed text-slate-700">
            Blockchain technology has revolutionized digital value exchange through robust consensus mechanisms.
            Traditional mining systems, while technically impressive and mathematically elegant, remain abstract for
            most individuals. Mining through real-world achievements offers a complementary approach that brings
            blockchain into everyday life. Each validated achievement not only contributes to network security but also
            creates lasting value by documenting human accomplishment. This approach makes blockchain participation both
            technically robust and personally meaningful.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                &quot;Now she can&apos;t say I&apos;m just playing games while she does all the cleaning&quot;
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between cursor-pointer p-2">
          <h2 className="text-xl font-bold text-slate-800">Consensus and AwesomeCom</h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm mt-2 overflow-hidden p-8">
          <article className="prose lg:prose-lg mx-auto">
            <p className="leading-relaxed text-slate-700 font-sans">
              The consensus mechanism is built around a Technical Program Committee (TPC), inspired by academic
              conference review systems. Instead of solving computational puzzles, network security and validation are
              achieved through a distributed network of expert reviewers. These reviewers, consisting of qualified
              community members and AI agents, evaluate achievements across five dimensions: originality, creativity,
              difficulty, relevance, and presentation quality. Each submission requires at least three independent
              reviews, with reviewers assigning scores from 1 (reject) to 5 (strong accept). An achievement is validated
              and added to the blockchain when its median review score exceeds 3, representing a positive consensus from
              the TPC.
            </p>

            <p className="mt-4 leading-relaxed text-slate-700 font-sans">
              To implement this peer review consensus efficiently, we introduce AwesomeCom—a periodic validation session
              protocol that structures achievement submission and review in discrete time intervals. Similar to
              blockchain&apos;s block time, these sessions provide regular opportunities for achievement validation
              while maintaining system synchronization.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-8">
              <h4 className="font-semibold text-blue-900 mb-2">The 8-4-2-1 Protocol</h4>
              <p className="text-slate-700">Each 15-minute AwesomeCom session follows a precisely timed protocol:</p>
              <ul className="list-none pl-5 mt-2 space-y-2">
                <li className="flex items-start">
                  <span className="font-mono bg-blue-100 px-2 rounded mr-2">8min</span>
                  <span>Achievement submission and TPC formation</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-blue-100 px-2 rounded mr-2">4min</span>
                  <span>Peer review and validation</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-blue-100 px-2 rounded mr-2">2min</span>
                  <span>Block creation and consensus formation</span>
                </li>
                <li className="flex items-start">
                  <span className="font-mono bg-blue-100 px-2 rounded mr-2">1min</span>
                  <span>Network synchronization and concluding the session</span>
                </li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold mb-4">Validation Methodology</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
              <div className="bg-slate-50 p-6 rounded-lg">
                <h4 className="font-semibold mb-2">Phase I: Submission</h4>
                <p className="text-sm text-slate-600">
                  Formal achievement documentation with evidence, methodology, and domain-specific metrics
                </p>
              </div>
              <div className="bg-slate-50 p-6 rounded-lg">
                <h4 className="font-semibold mb-2">Phase II: Review</h4>
                <p className="text-sm text-slate-600">
                  Multi-validator assessment following standardized evaluation criteria
                </p>
              </div>
              <div className="bg-slate-50 p-6 rounded-lg">
                <h4 className="font-semibold mb-2">Phase III: Consensus</h4>
                <p className="text-sm text-slate-600">Threshold-based acceptance and blockchain integration</p>
              </div>
            </div>

            <h3 className="text-xl font-semibold mb-4">Economic Incentives</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
              <p className="text-sm text-slate-600 mb-4">
                The system implements a structured reward mechanism to incentivize quality submissions and thorough peer
                review:
              </p>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>Achievement Validation</span>
                  <span className="font-mono">50 AwesomeCoin</span>
                </li>
                <li className="flex justify-between">
                  <span>Block Creation</span>
                  <span className="font-mono">75 AwesomeCoin</span>
                </li>
                <li className="flex justify-between">
                  <span>Peer Review Contribution</span>
                  <span className="font-mono">10 AwesomeCoin each</span>
                </li>
              </ul>
            </div>

            <p className="leading-relaxed text-slate-700 font-sans">
              This consensus mechanism establishes a framework where blockchain validation serves both technological and
              scholarly purposes. By integrating peer review with periodic validation sessions, the system creates
              verifiable records of human achievement while maintaining the fundamental properties of decentralization
              and immutability that characterize blockchain systems.
            </p>
          </article>
        </div>
      </div>
    </div>
  )
}
