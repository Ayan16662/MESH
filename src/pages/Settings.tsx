export default function Settings() {
  const aiConfigured = Boolean(import.meta.env.VITE_AI_API_BASE && import.meta.env.VITE_AI_API_KEY)

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display font-700 text-2xl mb-6">Settings</h1>

      <div className="border border-line rounded-md bg-panel p-5 mb-4">
        <div className="font-display font-600 text-sm mb-2">AI Engineering Analysis</div>
        <p className="text-sm text-slate leading-relaxed">
          {aiConfigured
            ? 'An OpenAI-compatible endpoint is configured via .env — the Report page will call it, grounded in your simulation results.'
            : 'No AI endpoint configured. Set VITE_AI_API_BASE and VITE_AI_API_KEY in .env to use a live model; otherwise the Report page falls back to a deterministic, rule-based summary built from your simulation numbers.'}
        </p>
      </div>

      <div className="border border-line rounded-md bg-panel p-5 mb-4">
        <div className="font-display font-600 text-sm mb-2">Climate Data</div>
        <p className="text-sm text-slate leading-relaxed">
          Live weather is fetched from Open-Meteo (no API key required). If unreachable, THERMA falls back to the
          bundled Leh, Ladakh demo dataset — clearly labeled wherever it's shown.
        </p>
      </div>

      <div className="border border-line rounded-md bg-panel p-5">
        <div className="font-display font-600 text-sm mb-2">Data Storage</div>
        <p className="text-sm text-slate leading-relaxed">
          Projects are stored in this browser's local storage. Clearing browser data will remove them. See the
          README for how to connect a real backend (Node/Express + MongoDB) using the same project schema.
        </p>
      </div>
    </div>
  )
}
