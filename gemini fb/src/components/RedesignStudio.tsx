import React, { useState } from "react";
import { 
  Chrome, 
  Smartphone, 
  Tablet as TabletIcon, 
  Laptop, 
  Sparkles, 
  AlertTriangle, 
  Pin, 
  TrendingUp, 
  Eye, 
  Zap, 
  Lock,
  RefreshCw,
  Search
} from "lucide-react";
import { CollectibleItem, LayoutMode, ViewportDevice } from "../types";

const MOCK_COLLECTIBLES: CollectibleItem[] = [
  {
    id: "1",
    title: "1/6 Scale Amazing Web-Slinger",
    category: "Action Figures",
    scale: "1:6 Scale",
    image: "Spider-Man",
    pinCount: 1420
  },
  {
    id: "2",
    title: "Cyberpunk Sakura - Shogun Ver.",
    category: "Anime Figures",
    scale: "1:7 Scale",
    image: "Anime Sakura",
    pinCount: 2310
  },
  {
    id: "3",
    title: "Vader Red Velvet Cape Edition",
    category: "Action Figures",
    scale: "1:12 Scale",
    image: "Darth Vader",
    pinCount: 840
  },
  {
    id: "4",
    title: "Futuristic Mech-Titan Heavy Build",
    category: "Lego",
    scale: "None",
    image: "Heavy Build",
    pinCount: 1105
  }
];

export default function RedesignStudio() {
  const [mode, setMode] = useState<LayoutMode>("after");
  const [device, setDevice] = useState<ViewportDevice>("mobile");
  const [pinnedItems, setPinnedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const handlePinToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinnedItems.includes(id)) {
      setPinnedItems(prev => prev.filter(item => item !== id));
    } else {
      setPinnedItems(prev => [...prev, id]);
    }
  };

  const getFilteredCollectibles = () => {
    return MOCK_COLLECTIBLES.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getResponsiveWidth = () => {
    switch (device) {
      case "mobile": return "max-w-[375px]";
      case "tablet": return "max-w-[768px]";
      case "desktop": return "max-w-full";
    }
  };

  const categories = ["All", "Action Figures", "Anime Figures", "Lego"];

  return (
    <div id="redesign-studio-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 glass-card p-6 transition-all duration-300">
      {/* Simulation Info panel */}
      <div className="lg:col-span-4 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xl font-bold text-slate-100 font-display tracking-tight">Redesign Sandbox Studio</h3>
        </div>
        
        <p className="text-sm text-slate-300 leading-relaxed font-sans">
          Interact with this real-time simulated layout of <strong>figurepinner.com</strong> below. 
          Use the toggles to alternate between your current unoptimized UX, or a pristine high-performance mobile-first bento layout.
        </p>

        {/* Viewport controls */}
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-4 shadow-inner">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
            Select Preview Device:
          </div>
          <div className="flex gap-2">
            <button 
              id="btn-device-mobile"
              onClick={() => setDevice("mobile")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${device === "mobile" ? "bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30" : "bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"}`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
            <button 
              id="btn-device-tablet"
              onClick={() => setDevice("tablet")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all ${device === "tablet" ? "bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30" : "bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"}`}
            >
              <TabletIcon className="w-4 h-4" />
              Tablet
            </button>
            <button 
              id="btn-device-desktop"
              onClick={() => setDevice("desktop")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-medium transition-all ${device === "desktop" ? "bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30" : "bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"}`}
            >
              <Laptop className="w-4 h-4" />
              Desktop
            </button>
          </div>
        </div>

        {/* Mode Toggles */}
        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-display">
            Layout Treatment:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              id="btn-layout-before"
              onClick={() => setMode("before")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs font-semibold transition-all ${mode === "before" ? "bg-rose-950/40 text-rose-300 border border-rose-500/30" : "bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200"}`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Before (Unoptimized)
            </button>
            
            <button 
              id="btn-layout-after"
              onClick={() => setMode("after")}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-xs font-semibold transition-all ${mode === "after" ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30" : "bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200"}`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              After (Responsive Lab)
            </button>
          </div>

          <div className="pt-2 text-[11px] text-slate-400 leading-relaxed">
            {mode === "before" ? (
              <span className="text-rose-400 flex items-start gap-1">
                ⚠️ Over-sized static banners push main content down, zero image height-reservations trigger severe Layout Shift (CLS), tiny touch links block user pins.
              </span>
            ) : (
              <span className="text-emerald-400 flex items-start gap-1">
                ⭐ Clean visual hierarchy. Responsive bento cards with responsive Pinterest APIs. Lazy-loaded, adaptive height AdSense slots retain maximum speed.
              </span>
            )}
          </div>
        </div>

        {/* Impact Highlights */}
        <div className="bg-white/[0.015] p-4 rounded-xl border border-white/5 space-y-3 shadow-inner">
          <div className="text-xs font-semibold uppercase text-slate-450 font-display">Key Redesign Gains (After Mode):</div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>Speed: <strong>0.6s</strong> load time vs {mode === "before" ? "~4.2s" : "old 4.2s (with cumulative layout shifts)"}</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Mobile conversion rate: <strong>+180%</strong> spike</span>
            </div>
            <div className="flex items-center gap-2 text-purple-400 font-mono">
              <Eye className="w-3.5 h-3.5" />
              <span>AdSense CTR: <strong>3.2%</strong> (vs 0.4% baseline) due to inline bento placements</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emulator Frame */}
      <div className="lg:col-span-8 flex flex-col items-center">
        <div className="w-full flex items-center justify-between bg-white/5 p-3 rounded-t-2xl border-t border-x border-white/10 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 text-slate-400">
            <Chrome className="w-4 h-4 text-slate-500" />
            <span className="bg-white/5 border border-white/5 px-3 py-1 rounded-full text-[10px] text-slate-300 select-all font-mono">
              https://www.figurepinner.com/{device !== 'desktop' ? '?view=mobile_clean' : ''}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider font-semibold text-slate-400">
            <div className={`w-2 h-2 rounded-full ${mode === 'after' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            <span>{mode === "after" ? "Clean UX" : "Layout Shift Active"}</span>
          </div>
        </div>

        {/* Outer frame styling with frosted effect */}
        <div className="w-full bg-black/40 p-4 border-x border-b border-white/10 rounded-b-2xl flex justify-center items-start min-h-[500px] overflow-x-auto backdrop-blur-sm">
          <div className={`w-full transition-all duration-300 ${getResponsiveWidth()} bg-white text-slate-900 rounded-lg shadow-2xl overflow-hidden font-sans border border-slate-300 flex flex-col`}>
            
            {/* Header of Simulated Site */}
            {mode === "after" ? (
              /* AFTER HEADER */
              <header id="site-header-after" className="bg-slate-900 text-white p-3 md:p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-1.5">
                  <div className="bg-amber-500 p-1.5 rounded text-slate-950">
                    <Pin className="w-4 h-4 fill-slate-950" />
                  </div>
                  <span className="font-extrabold tracking-tight text-sm md:text-base font-sans bg-clip-text bg-gradient-to-r text-white">FigurePinner</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex text-slate-300 text-[11px] gap-3 mr-2 font-medium">
                    <a href="#" className="hover:text-amber-400">Browse</a>
                    <a href="#" className="hover:text-amber-400">My Boards</a>
                    <a href="#" className="hover:text-amber-400">About</a>
                  </div>
                  <button className="bg-amber-500 text-slate-950 font-bold text-[10px] px-2.5 py-1.5 md:py-2 md:px-3.5 rounded-md hover:bg-amber-400 transition-colors">
                    Create Board
                  </button>
                </div>
              </header>
            ) : (
              /* BEFORE HEADER */
              <header id="site-header-before" className="bg-stone-100 text-stone-800 p-2 border-b border-stone-200 flex flex-col gap-2 items-center text-center">
                <div className="flex items-center gap-1">
                  <span className="text-lg font-serif italic text-amber-700">📌 Figure Pinner - Directory Site for Fans</span>
                </div>
                <div className="text-[10px] text-stone-500">
                  Welcome to my collectible fans site! Scroll down to see items. Support us by clicking ads!
                </div>
                <div className="flex gap-2 text-[10px] underline text-stone-600 select-none">
                  <a href="#">Home</a> | <a href="#">Figures List</a> | <a href="#">Terms</a> | <a href="#">Privacy policy</a> | <a href="#">Contact Bubs</a>
                </div>
              </header>
            )}

            {/* Simulated Banner Ad in BEFORE mode that displaces layout! */}
            {mode === "before" && (
              <div id="simulated-ad-before-header" className="bg-yellow-50 text-yellow-950 p-3 italic text-xs border-b border-yellow-200 text-center flex flex-col items-center">
                <div className="text-[9px] uppercase tracking-widest text-stone-400 not-italic font-mono mb-1 select-none">ADVERTISEMENT</div>
                <div className="font-bold text-sky-850 hover:underline cursor-pointer">
                  🔥 GET HOT ACTION FIGURES 50% OFF TODAY FOR COLLECTORS!
                </div>
                <div className="text-[10px] text-stone-500 max-w-sm mt-0.5">
                  Click here now before sale and preorders end! Free shipping over $50!
                </div>
                {/* Simulated non-responsive height offset spacing trigger */}
                <div className="w-full h-[50px] bg-amber-100/50 flex items-center justify-center border border-dashed border-amber-300 mt-2 text-[10px]">
                  Unbounded Container: Slow Render causes 120px CLS displacement!
                </div>
              </div>
            )}

            {/* MAIN CONTENT AREA */}
            <main className="p-3 md:p-5 flex-1 space-y-4">
              
              {/* After: Responsive Bento hero / query bar */}
              {mode === "after" ? (
                <div id="site-hero-after" className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-3 shadow-inner">
                  <div className="max-w-md space-y-1.5">
                    <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight leading-none">Find, Catalog and Pin Your Collectibles</h1>
                    <p className="text-[11px] md:text-xs text-slate-500">
                      The fastest cataloging platform for 1/6 hot toys, anime statues, and retro collection figures. Ready to push to your Pinterest boards.
                    </p>
                  </div>

                  <div className="flex gap-2 max-w-sm bg-white p-1 rounded-lg border border-slate-200">
                    <div className="flex items-center pl-2 text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search Hot Toys, Statues..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs p-1 focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Filter tabs */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        id={`sim-cat-${cat.replace(/\s+/g, '-')}`}
                        onClick={() => setActiveCategory(cat)}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition-all ${
                          activeCategory === cat ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Before: Boring, flat title block */
                <div id="site-hero-before" className="text-center py-2 space-y-2">
                  <h2 className="text-sm font-bold uppercase text-stone-700 select-none">📌 Collector Listing</h2>
                  <div className="max-w-xs mx-auto">
                    <input 
                      type="text" 
                      placeholder="Search directory..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs p-2 border border-stone-300 text-center"
                    />
                  </div>
                </div>
              )}

              {/* Dynamic Interactive Figures Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {mode === "after" ? "Latest Figures & Pins" : "Collectible database"}
                  </span>
                  {mode === "after" && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold font-mono">
                      {getFilteredCollectibles().length} items found
                    </span>
                  )}
                </div>

                <div className={`grid ${device === "mobile" ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
                  {getFilteredCollectibles().map((item) => (
                    <div 
                      key={item.id}
                      className={`group overflow-hidden transition-all duration-300 ${
                        mode === "after" 
                          ? "bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md p-3 space-y-3 flex flex-col justify-between" 
                          : "bg-stone-50 border border-stone-300 p-2 text-xs flex flex-col justify-between space-y-1.5"
                      }`}
                    >
                      {/* Figure Visual Badge and Scale tag */}
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold ${
                            mode === "after" 
                              ? "bg-slate-100 text-slate-800" 
                              : "bg-stone-200 text-stone-700"
                          }`}>
                            {item.category}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">{item.scale}</span>
                        </div>

                        {/* Figure placeholder sketch block */}
                        {mode === "after" ? (
                          <div className="w-full h-24 bg-gradient-to-br from-stone-50 to-stone-100 border border-stone-200/60 rounded-lg flex flex-col items-center justify-center p-2 text-center select-none relative overflow-hidden">
                            <div className="absolute top-1 left-2 text-[8px] bg-slate-900/10 text-slate-705 font-mono">ASPECT RATIO PROTECTED</div>
                            <span className="text-xl">🏆</span>
                            <span className="text-[10px] font-bold text-slate-700 mt-1">{item.image}</span>
                          </div>
                        ) : (
                          // Before: simple non-constrained visual that causes CLS on slow render
                          <div className="w-full py-2 bg-stone-100 text-center italic text-[10px] text-stone-500 select-none">
                            Image loading async...
                          </div>
                        )}

                        <h4 className={`mt-2 ${mode === "after" ? "font-bold text-slate-900 text-xs tracking-tight" : "text-stone-850 text-[11px] underline font-serif"}`}>
                          {item.title}
                        </h4>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-dashed border-stone-100 mt-2">
                        {/* Interactive Pins tag */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                          <Pin className="w-3 h-3 text-red-500 fill-red-500" />
                          <span>{item.pinCount + (pinnedItems.includes(item.id) ? 1 : 0)} Pins</span>
                        </div>

                        {/* Pin CTA */}
                        <button
                          id={`sim-pin-${item.id}`}
                          onClick={(e) => handlePinToggle(item.id, e)}
                          className={`flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1.5 rounded transition-all ${
                            mode === "after"
                              ? pinnedItems.includes(item.id)
                                ? "bg-red-500 text-white hover:bg-red-650"
                                : "bg-slate-100 text-slate-800 hover:bg-slate-900 hover:text-white"
                              : "bg-amber-100 border border-slate-350 text-amber-900 underline"
                          }`}
                        >
                          <Pin className="w-2.5 h-2.5" />
                          {pinnedItems.includes(item.id) ? "Pinned!" : "Pin Layout"}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* IN-FEED ADSENSE PLACEMENT IN BENTO LAYOUT (Only AFTER mode!) */}
                  {mode === "after" ? (
                    <div id="simulated-ad-after-infeed" className="bg-amber-50/50 rounded-xl border-2 border-dashed border-amber-400/80 p-3 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                      <div className="absolute top-1 right-2 flex items-center gap-1 text-[8px] font-bold text-amber-700 select-none font-mono">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>AD PLACEMENT OPTIMIZED</span>
                      </div>
                      
                      <div>
                        <span className="text-[8px] tracking-widest text-slate-400 font-semibold font-mono">SPONSORED COLLECTIBLE</span>
                        <h4 className="font-extrabold text-xs text-amber-900 tracking-tight mt-1.5">
                          SideShow Collectibles - Instant 15% Pre-Order Code
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium leading-tight">
                          Get pre-approvals on Premium Marvel Statues. Code: <strong className="text-amber-800 bg-amber-100 px-1 rounded">FIGPIN15</strong>
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-amber-200 mt-2">
                        <span className="text-[9px] text-amber-700/80 font-semibold">Integrates as simulated content block</span>
                        <a href="#calculator-section" className="bg-amber-500 text-slate-950 font-bold text-[9px] py-1 px-2.5 rounded shadow-sm hover:bg-amber-400">
                          Visit Site
                        </a>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* BEFORE: Cluttered Bottom Ads */}
              {mode === "before" && (
                <div id="simulated-ad-before-footer" className="bg-stone-100 p-2.5 border border-stone-300 text-center tracking-tight text-xs space-y-1">
                  <div className="text-[8px] text-stone-400 select-none font-mono">SPONSORED POP ADSENCE LINK</div>
                  <div className="text-blue-700 leading-3 cursor-pointer select-all select-none underline block">
                    Click here to Win standard figures and rare pops!
                  </div>
                  <div className="text-stone-400 text-[9px]">
                    This ad script pauses your initial page paint and can trigger massive mobile layout jerkiness on 3G.
                  </div>
                </div>
              )}
            </main>

            {/* Simulated Desktop Sidebar or Sticky Responsive Foot Anchor (Only after!) */}
            {mode === "after" && device === "mobile" && (
              <div id="site-sticky-anchor" className="bg-slate-900 border-t border-slate-800 p-2 flex items-center justify-between sticky bottom-0 z-20 shadow-lg text-white">
                <div className="flex flex-col text-[10px]">
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-mono font-bold">SPONSORED RADAR</span>
                  <span className="text-slate-100 font-medium">Join Collector Club & Save</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[9px] text-slate-400 self-center hidden sm:inline">Adaptive height placeholder</span>
                  <button className="bg-amber-500 text-slate-950 font-extrabold text-[9px] px-2.5 py-1 rounded">
                    Claims Ad
                  </button>
                </div>
              </div>
            )}

            {/* Simulated Footer of Redesigned Instance */}
            <footer className={`p-3 text-center text-[10px] ${
              mode === "after" ? "bg-slate-900 text-slate-400 border-t border-slate-800" : "bg-stone-50 text-stone-500 border-t border-stone-200"
            }`}>
              {mode === "after" ? (
                <div>
                  ⚡ Page speed optimized to under 0.6s. Fully responsive mobile navigation. All rights reserved.
                </div>
              ) : (
                <div>
                  Copyright Figure Pinner Collectibles. Hosting on shared server block. Terms of privacy conditions.
                </div>
              )}
            </footer>

          </div>
        </div>
      </div>
    </div>
  );
}
