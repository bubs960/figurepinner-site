import { useState } from "react";
import { 
  Sparkles, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  ShieldAlert, 
  HelpCircle,
  Copy,
  Check,
  Percent,
  TrendingUp,
  Award
} from "lucide-react";
import { AICritiqueResult } from "../types";

const DEMO_PRESETS = [
  {
    label: "Sgt. Slaughter Page",
    category: "AdSense Revenue & Ad Placements",
    text: `<!-- Character Detail Page: Sgt. Slaughter - Jakks Pacific Classic Superstars 27 -->
<div class="character-details-container md:grid md:grid-cols-12 gap-6 p-4 max-w-7xl font-sans" style="margin: 0 auto;">
  
  <!-- Left Side: Unresponsive Skyscraper Ad Unit (Forces sideways scroll on Mobile) -->
  <aside class="md:col-span-3 bg-stone-50 p-3 border border-stone-200">
    <div class="ad-label" style="font-size: 9px; color: #999; margin-bottom: 4px;">SPONSORED COUPLING AD</div>
    <ins class="adsbygoogle"
         style="display:inline-block;width:160px;height:600px"
         data-ad-client="ca-pub-XXXXXXXXX"
         data-ad-slot="XXXX"></ins>
  </aside>

  <!-- Right Side: Figure Content (Details & Actions) -->
  <main class="md:col-span-9 space-y-4 text-left">
    <nav class="breadcrumb text-[11px] text-stone-500 mb-2">
      Wrestling > Jakks Pacific > Classic Superstars > Series 27 > Sgt Slaughter
    </nav>

    <h1 class="text-xl md:text-2xl font-bold text-stone-900 border-b pb-2">
      Sgt. Slaughter - Classic Superstars Series 27
    </h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Fig Picture: Unoptimized size raw image (Forces severe Layout Shift) -->
      <div class="image-well">
        <img src="https://images.figurepinner.com/large/sgt-slaughter-cs27.jpg" alt="Sgt. Slaughter CS 27 Packaging" class="w-full h-auto">
        <p class="text-[10px] text-stone-400 mt-1 italic">Release: Jakks Pacific Collectibles, Late 2009. WWE Icon</p>
      </div>

      <!-- Specifications checklist -->
      <div class="specs-box space-y-3">
        <div class="bg-stone-50 border p-3 rounded text-stone-700 text-xs leading-relaxed space-y-1">
          <div><strong>Manufacturer:</strong> Jakks Pacific</div>
          <div><strong>Line:</strong> Classic Superstars</div>
          <div><strong>Series:</strong> Series 27</div>
          <div><strong>Character:</strong> Sgt. Slaughter (Sarge)</div>
          <div><strong>Accessories:</strong> Removable camou vest, USA flag, swagger stick, aviators, campaign hat</div>
        </div>

        <!-- Call To Actions (Critical Pin buttons too small to tap, under 30px height!) -->
        <div class="ctas flex gap-1.5 pt-2">
          <button onclick="pinToBoard()" class="text-xs bg-red-650 text-white font-semibold px-3 py-1 bg-red-500" style="height: 28px;">📌 Pin to Board</button>
          <button onclick="addCollection()" class="text-xs border border-stone-400 px-3" style="height: 28px;">Add to Shelve</button>
        </div>
      </div>

    </div>

    <!-- Bottom Leaderboard Option (Breaks tablet layout limits) -->
    <div id="bottom-leaderboard-slot" class="w-full text-center mt-6">
      <ins class="adsbygoogle"
           style="display:inline-block;width:728px;height:90px"
           data-ad-client="ca-pub-XXXXXXXXX"
           data-ad-slot="YYYY"></ins>
    </div>

  </main>
</div>`
  },
  {
    label: "Landing Page Structure",
    category: "Landing Page Layout & Responsiveness",
    text: `<div class="desktop-header font-serif" style="width: 1200px; margin: 0 auto;">
  <div class="logo">FigurePinner - Main List</div>
  <!-- Fixed links are hard to touch on mobile devices -->
  <div class="navigation" style="float: right;">
    <a href="/list" style="padding: 5px;">Browse Figures</a>
    <a href="/boards" style="padding: 5px;">My Board Pins</a>
  </div>
</div>

<div class="gallery" style="margin-top: 50px;">
  <!-- Non-responsive table grid pushes screen bounds on iPhone SE -->
  <table width="100%">
    <tr>
      <td>
        <img src="/img/vader_statue.jpg">
        <h3>Amazing Darth Vader 1/6 Scale Figure</h3>
        <button onclick="savePin(1)">📌 Pin It</button>
      </td>
      <td>
        <img src="/img/rem_anime.jpg">
        <h3>Rem Crystal Anime Figure Dress Ver.</h3>
        <button onclick="savePin(2)">📌 Pin It</button>
      </td>
    </tr>
  </table>
</div>`
  },
  {
    label: "AdSense Integrations",
    category: "AdSense Revenue & Ad Placements",
    text: `<!-- Current ad units are placed right at the top of the screen before the page titles -->
<div id="top-ad-block" class="w-full text-center">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXX" crossorigin="anonymous"></script>
  <!-- Non-responsive 728x90 Leaderboard banner. Breaks layout on small width viewports! -->
  <ins class="adsbygoogle"
       style="display:inline-block;width:728px;height:90px"
       data-ad-client="ca-pub-XXXXXXXXX"
       data-ad-slot="XXXXXXXXX"></ins>
  <script>
       (adsbygoogle = window.adsbygoogle || []).push({});
  </script>
</div>

<div class="content">
  <h1>Hot Toys Collectibles & Pins list</h1>
  <!-- Multiple popup popunder adsense redirects trigger on touch -->
</div>`
  },
  {
    label: "Core Web Vitals & Speed",
    category: "Core Web Vitals & Speed Scores",
    text: `<!-- Heavy, high-res images are served raw without lazy-loading properties or static height attributes -->
<div class="figure-listing">
  <img src="https://figurepinner.com/uploads/original_massive_quality_10mb.png" alt="Sideshow Spider-Man">
  <img src="https://figurepinner.com/uploads/rem_statue_uncompressed.jpg" alt="Aesthetic Anime Statues">
</div>

<!-- Heavy custom standard scripts impede DOM parsing -->
<script src="/js/heavy-jquery-3.x-and-all-plugins.min.js"></script>
<script src="/js/custom-interactive-d3-canvas-snow-effect.js"></script>`
  }
];

export default function AIAdvisor() {
  const [activeCategory, setActiveCategory] = useState<string>("Landing Page Layout & Responsiveness");
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [critique, setCritique] = useState<AICritiqueResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedSnippetIdx, setCopiedSnippetIdx] = useState<number | null>(null);

  const selectPreset = (label: string) => {
    const preset = DEMO_PRESETS.find(p => p.label === label);
    if (preset) {
      setInputText(preset.text);
      setActiveCategory(preset.category);
    }
  };

  const handleRunCritique = async () => {
    if (!inputText.trim()) {
      setErrorMsg("Please paste some code, design descriptions, or select a demo preset first.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setCritique(null);

    try {
      const response = await fetch("/api/gemini/critique", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: activeCategory,
          text: inputText
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze your request. Please confirm server variables are set up.");
      }

      setCritique(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred while running the review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySnippet = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedSnippetIdx(index);
    setTimeout(() => setCopiedSnippetIdx(null), 2000);
  };

  return (
    <div id="ai-advisor-section" className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h3 className="text-xl font-bold text-slate-100 font-display tracking-tight">AI Layout & Monetization Critique</h3>
        </div>
        
        {/* Audit Categories Selector */}
        <select 
          id="select-audit-cat"
          value={activeCategory} 
          onChange={(e) => setActiveCategory(e.target.value)}
          className="bg-black/40 border border-white/5 text-slate-200 text-xs rounded-xl p-2.5 outline-none font-semibold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          <option value="Landing Page Layout & Responsiveness">Landing Page Layout & Responsiveness</option>
          <option value="AdSense Revenue & Ad Placements">AdSense Revenue & Ad Placements</option>
          <option value="Core Web Vitals & Speed Scores">Core Web Vitals & Speed Scores</option>
          <option value="CTA conversion & Pin Saves Flow">CTA conversion & Pin Saves Flow</option>
        </select>
      </div>

      <p className="text-sm text-slate-300 font-sans">
        Paste a block of HTML codes, CSS layouts, AdSense scripts, or describe your mobile responsive goals below. The server-side Gemini 2.5 API will execute a secure critique, scoring your optimization level and writing custom corrective code.
      </p>

      {/* Demo Presets Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold font-sans">Try Prefill Demo Code:</span>
        {DEMO_PRESETS.map((p) => (
          <button
            key={p.label}
            id={`btn-preset-${p.label.replace(/\s+/g, '-')}`}
            onClick={() => selectPreset(p.label)}
            className="text-[11px] bg-white/[0.02] hover:bg-white/[0.05] px-3 py-1.5 rounded-lg border border-white/5 text-slate-300 hover:text-indigo-300 font-medium transition-all cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Text Input Panel */}
        <div className="xl:col-span-6 space-y-4">
          <div className="relative">
            <textarea
              id="textarea-ai-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="<!-- Paste your landing page wrapper, css sheets, or images layout code here -->..."
              className="w-full min-h-[300px] bg-black/40 backdrop-blur-md text-[11px] font-mono text-slate-300 p-4 rounded-xl border border-white/5 outline-none focus:border-indigo-500 shadow-inner placeholder-slate-700 select-text"
            />
            
            {/* Run Button */}
            <div className="absolute bottom-3 right-3">
              <button
                id="btn-run-advisor"
                onClick={handleRunCritique}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-650 to-purple-650 disabled:from-slate-800 disabled:to-slate-800 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-sans cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Analyzing Code...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Run AI Review
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-950/40 border border-rose-905 text-rose-400 text-xs rounded-xl flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* AI Output Panel */}
        <div className="xl:col-span-6 flex flex-col justify-between bg-white/[0.012] p-5 rounded-2xl border border-white/5 min-h-[300px] relative overflow-hidden shadow-inner">
          
          {isLoading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center space-y-4 z-20">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-550/10 border-t-indigo-550 animate-spin" />
                <Sparkles className="w-5 h-5 text-indigo-400 absolute top-3.5 left-3.5 animate-pulse" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-200 uppercase tracking-widest animate-pulse font-display">Consulting UI/UX Specialist</p>
                <p className="text-[10px] text-slate-400 font-sans">Checking layout shift, ad placement, and responsive bounds of FigurePinner...</p>
              </div>
            </div>
          )}

          {!isLoading && !critique && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-10 h-10 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-slate-500" />
              </div>
              <div className="max-w-xs space-y-1">
                <p className="text-xs font-bold text-slate-300 uppercase font-display">Consultant Dormant</p>
                <p className="text-[11px] text-slate-500 leading-normal font-sans">
                  No layout loaded. Push "Try Prefill Demo Code" above and trigger analyze to evaluate FigurePinner structures.
                </p>
              </div>
            </div>
          )}

          {critique && (
            <div className="space-y-6">
              
              {/* Overall Score Dial block */}
              <div className="flex items-center gap-4 bg-white/[0.015] p-4 rounded-xl border border-white/5 flex-wrap sm:flex-nowrap shadow-inner">
                <div className="flex flex-col items-center justify-center bg-black/30 p-4 rounded-full border border-white/5 shrink-0 w-24 h-24 shadow-md">
                  <Award className="w-4 h-4 text-indigo-400 mb-1" />
                  <span className={`text-2xl font-extrabold font-mono ${
                    critique.score >= 80 ? "text-emerald-400 animate-pulse" : critique.score >= 50 ? "text-yellow-400" : "text-rose-400"
                  }`}>
                    {critique.score}
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono uppercase tracking-widest font-bold">Grade</span>
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">AI Overall Assessment:</div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{critique.summary}</p>
                </div>
              </div>

              {/* Action items checklist / Bento snippets */}
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase text-slate-400 tracking-wider font-display">High-Impact Resolution steps:</div>
                <div className="space-y-3">
                  {critique.action_items.map((item, idx) => (
                    <div key={idx} className="bg-white/[0.022] p-4 rounded-xl border border-white/5 space-y-2.5 shadow-inner">
                      <div className="flex items-start gap-2">
                        <div className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 p-1 rounded font-bold text-[10px] w-5 h-5 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="text-xs font-extrabold text-slate-100 font-display">{item.title}</h5>
                          <p className="text-[11px] text-slate-400 leading-normal font-sans">{item.description}</p>
                        </div>
                      </div>

                      {/* Display Suggested code */}
                      {item.code_snippet && (
                        <div className="relative group bg-black/40 rounded-lg p-3 border border-white/5 mt-2 max-h-[140px] overflow-auto">
                          <pre className="text-[10px] font-mono text-slate-300 leading-relaxed">{item.code_snippet}</pre>
                          
                          {/* Inner Copy block */}
                          <button
                            id={`btn-copy-review-snippet-${idx}`}
                            onClick={() => handleCopySnippet(item.code_snippet, idx)}
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-slate-300 border border-white/5 hover:text-indigo-300 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Copy suggested code"
                          >
                            {copiedSnippetIdx === idx ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Potential AdSense Increase banner info */}
              <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/15 flex items-center gap-3 shadow-inner">
                <TrendingUp className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">EARNINGS POTENTIAL WITH FIX</div>
                  <p className="text-xs text-slate-200 font-medium font-sans">{critique.adsense_earnings_potential}</p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
