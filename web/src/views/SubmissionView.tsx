const awesomeComStatus = {
  edition: 42,
  theme: "Computational Fitness",
  phase: "Achievement Submission",
  phaseRemaining: 285000,
  editionRemaining: 485000,
}

export default function SubmissionView() {
  return (
    <div className="max-w-3xl mx-auto p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Submit Achievement</h1>
        <p className="text-slate-600 font-sans">
          Submit your achievement for the current AwesomeCom session on &quot;{awesomeComStatus.theme}&quot;
        </p>
      </header>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 font-sans">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Authors</label>
            <input
              type="text"
              placeholder="Name(s) and affiliations"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Abstract</label>
            <textarea
              rows={3}
              placeholder="A brief summary of your achievement"
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description</label>
            <textarea
              rows={6}
              placeholder={`Describe your achievement related to "${awesomeComStatus.theme}" in detail. Include methodology, results, and significance.`}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supporting Evidence</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4h-8m-12 0H8m12 0v-8m12 8v-8m0 0h-8m0 0v-8m-8 8v-20a4 4 0 014-4h12"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-slate-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                    <span>Upload files</span>
                    <input type="file" className="sr-only" />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">PNG, JPG, PDF up to 10MB</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Submission Guidelines</h3>
            <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
              <li>
                Submissions must align with the current theme:{" "}
                <span className="font-medium">{awesomeComStatus.theme}</span>
              </li>
              <li>Include sufficient evidence to support your claims</li>
              <li>Achievements are subject to peer review by the Technical Program Committee</li>
              <li>Accepted achievements will be awarded 50 AwesomeCoin tokens</li>
            </ul>
          </div>

          <div className="pt-2">
            <button className="w-full bg-blue-700 hover:bg-blue-800 text-white py-2 px-4 rounded-md font-medium transition-colors">
              Submit for Review
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
