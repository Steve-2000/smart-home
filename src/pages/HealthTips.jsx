import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

// Read API key from Vite env if available
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent";

/** Parse Gemini response into text + sources */
const processApiResponse = (result) => {
  const candidate = result?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text || "";
  let sources = [];
  const groundingMetadata = candidate?.groundingMetadata;
  if (groundingMetadata && groundingMetadata.groundingAttributions) {
    sources = groundingMetadata.groundingAttributions
      .map(a => ({ uri: a.web?.uri, title: a.web?.title }))
      .filter(s => s.uri && s.title);
  }
  return { text, sources };
};

/** Offline sample fallback generator (returns HTML) */
const generateMockTips = (query) => {
  const q = (query || "").toLowerCase();
  const petType = q.includes("cat") ? "cat" : q.includes("dog") ? "dog" : "pet";
  const tips = [
    `Regular checkups: schedule vet visits every 6-12 months for ${petType} health screenings.`,
    `Balanced diet: feed portion-controlled, species-appropriate food and avoid table scraps.`,
    `Exercise & enrichment: provide daily physical activity and mental stimulation tailored to your ${petType}.`,
    `Preventative care: keep vaccinations, parasite control, and dental care up to date.`,
    `Monitor behavior & environment: watch for changes (appetite, bathroom habits, breathing) and ensure smoke/gas detectors and safe indoor air.`
  ];
  return `<ol class="list-group list-group-numbered">${tips.map(t => `<li class="list-group-item">${t}</li>`).join('')}</ol>`;
};

const HealthTips = () => {
  const initialPrompt = "Top 5 general tips for dog health";
  const [topic, setTopic] = useState(initialPrompt);
  const [tipsHtml, setTipsHtml] = useState("");
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usedSample, setUsedSample] = useState(!apiKey); // true when no API key
  const liveBtnRef = useRef(null);

  useEffect(() => {
    // On mount: if no api key show sample; else fetch live tips
    if (!apiKey) {
      setError("API key not configured — showing offline sample tips. Set VITE_GEMINI_API_KEY to enable live generation.");
      setTipsHtml(generateMockTips(initialPrompt));
      setSources([]);
      setUsedSample(true);
      return;
    }
    generateTips(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWithRetryJson = async (url, options, maxRetries = 4) => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const resp = await fetch(url, options);
        if (!resp.ok) {
          const txt = await resp.text().catch(() => "");
          // treat auth errors specially
          if (resp.status === 401 || resp.status === 403) {
            throw new Error(`Authentication error (status ${resp.status}).`);
          }
          throw new Error(`HTTP ${resp.status} ${resp.statusText} ${txt}`);
        }
        return await resp.json();
      } catch (e) {
        attempt++;
        if (attempt >= maxRetries) throw e;
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }
  };

  const generateTips = async (query = topic, forceSample = false) => {
    setError(null);
    setIsLoading(true);
    setTipsHtml("");
    setSources([]);

    if (!query || !query.trim()) {
      setError("Please enter a topic.");
      setIsLoading(false);
      return;
    }

    if (forceSample || !apiKey) {
      setUsedSample(true);
      setTipsHtml(generateMockTips(query));
      setIsLoading(false);
      return;
    }

    const systemPrompt = "You are an expert veterinarian. Generate 5 concise actionable health tips for the topic. Output only the numbered list items.";
    const payload = {
      contents: [{ parts: [{ text: query }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] }
    };

    try {
      const result = await fetchWithRetryJson(`${API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const { text, sources: apiSources } = processApiResponse(result);
      // Convert plain text list to safe HTML list
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      const items = lines.map(l => l.replace(/^\s*(\d+\.|\*|-)\s*/, '').trim());
      const html = `<ol class="list-group list-group-numbered">${items.map(i => `<li class="list-group-item">${i}</li>`).join('')}</ol>`;
      setTipsHtml(html);
      setSources(apiSources || []);
      setUsedSample(false);
    } catch (e) {
      console.error("Generate error:", e);
      setError("Live generation failed. Showing offline sample tips. Check console for details.");
      setTipsHtml(generateMockTips(query));
      setSources([]);
      setUsedSample(true);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    generateTips(topic);
  };

  const copyTips = async () => {
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = tipsHtml;
      const text = tmp.innerText || tmp.textContent || "";
      await navigator.clipboard.writeText(text);
      // small transient confirmation
      setError("Tips copied to clipboard.");
      setTimeout(() => setError(null), 1800);
    } catch (e) {
      setError("Failed to copy.");
    }
  };

  const downloadTips = () => {
    const tmp = document.createElement('div');
    tmp.innerHTML = tipsHtml;
    const text = tmp.innerText || tmp.textContent || "";
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_').toLowerCase()}_tips.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center mb-4">
        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width:56,height:56}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 2C8 5 5 7 5 11c0 5 7 11 7 11s7-6 7-11c0-4-3-6-7-9z" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <h2 className="mb-0">Pet Health Assistant</h2>
          <small className="text-muted">Concise, actionable care tips — live or sample mode.</small>
        </div>
        <div className="ms-auto">
          <span className={`badge ${usedSample ? 'bg-warning text-dark' : 'bg-success'}`}>
            {usedSample ? 'Sample Mode' : 'Live Mode'}
          </span>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <form onSubmit={onSubmit}>
                <label className="form-label small fw-medium">Topic</label>
                <input
                  aria-label="Topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="form-control mb-3"
                  placeholder="e.g., dog joint care, cat urinary health"
                />

                <div className="d-flex gap-2 mb-2">
                  <button
                    ref={liveBtnRef}
                    type="submit"
                    className="btn btn-primary flex-fill"
                    disabled={isLoading || !apiKey}
                    title={apiKey ? "Generate live tips" : "API key missing"}
                  >
                    {isLoading ? (<><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden></span>Generating...</>) : (apiKey ? 'Get Live Tips' : 'Live Disabled')}
                  </button>

                  <button
                    type="button"
                    onClick={() => generateTips(topic, true)}
                    className="btn btn-outline-secondary"
                  >
                    Use Sample
                  </button>
                </div>

                <div className="mb-3">
                  <small className="text-muted">{apiKey ? 'Live generation enabled.' : 'No API key — offline samples active.'}</small>
                </div>

                <div className="d-grid gap-2">
                  <button onClick={copyTips} type="button" className="btn btn-light border" disabled={!tipsHtml}>Copy Tips</button>
                  <button onClick={downloadTips} type="button" className="btn btn-light border" disabled={!tipsHtml}>Download .txt</button>
                </div>
              </form>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              {error}
            </div>
          )}
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h5 className="card-title mb-0">Advice for <span className="fst-italic text-primary">"{topic}"</span></h5>
                <small className="text-muted">{usedSample ? 'Sample' : 'Live'}</small>
              </div>

              {isLoading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="mt-3 text-primary">Generating advice…</div>
                </div>
              )}

              {!isLoading && tipsHtml && (
                <div dangerouslySetInnerHTML={{ __html: tipsHtml }} />
              )}

              {!isLoading && !tipsHtml && (
                <div className="text-center text-muted py-5">
                  No tips yet. Enter a topic and click Get Live Tips or Use Sample.
                </div>
              )}

              {sources.length > 0 && (
                <div className="mt-4">
                  <h6>Sources</h6>
                  <ul className="list-group list-group-flush">
                    {sources.map((s, i) => (
                      <li key={i} className="list-group-item px-0">
                        <a href={s.uri} target="_blank" rel="noreferrer" className="text-decoration-none">{s.title || s.uri}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthTips;