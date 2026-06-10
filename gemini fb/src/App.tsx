import { useState } from "react";
import { 
  Sparkles, 
  Smartphone, 
  TrendingUp, 
  Zap, 
  Code2, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Pin,
  ExternalLink,
  ChevronRight,
  Monitor,
  Cpu
} from "lucide-react";
import RedesignStudio from "./components/RedesignStudio";
import RevenueCalculator from "./components/RevenueCalculator";
import CodeBlueprint from "./components/CodeBlueprint";
import AIAdvisor from "./components/AIAdvisor";

type TabID = "sandbox" | "calculator" | "ai" | "blueprints";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabID>("sandbox");

  const tabItems = [
    { id: "sandbox", label: "Redesign Sandbox", count: "Simulate", icon: Smartphone },
    { id: "calculator", label: "Earnings Estimator", count: "Calculator", icon: TrendingUp },
    { id: "ai", label: "AI Layout Critiquer", count: "Gemini", icon: Sparkles },
    { id: "blueprints", label: "Code Blueprints", count: "Copy-Paste", icon: Code2 },
  ] as const;

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Warning/Context Banner */}
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 p-2.5 text-center text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-wider">
            Optimizing
          </span>
          <span className="text-slate-300 font-medium">Working together to optimize</span>
          <a 
            href="https://figurepinner.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-0.5 transition-colors"
          >
            figurepinner.com <ExternalLink className="w-3 h-3 text-indigo-400/50" />
          </a>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400">Targeting mobile load time under 0.8s, responsive pins, and 3x AdSense CTR.</span>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Header Block in Glass Profile */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white shadow-xl shadow-indigo-500/10">
                <Pin className="w-5 h-5 fill-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white tracking-tight leading-none bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                FigurePinner Studio
              </h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl font-medium leading-relaxed">
              An interactive optimization lab to boost conversion, accelerate Loading Speeds, and optimize AdSense banner slots for your collection catalog.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col text-right font-mono text-[10px] text-slate-500">
              <span>ESTIMATED MAX SPEED</span>
              <span className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1 justify-end">
                <Zap className="w-3.5 h-3.5" />
                0.6s Loading
              </span>
            </div>
            <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />
            
            {/* Tech tag */}
            <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-semibold text-slate-350 shadow-inner">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full-Stack Lab</span>
            </div>
          </div>
        </div>

        {/* Strategic Overview Pillars built as Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Pillar 1: Mobile Responsiveness */}
          <div className="glass-card p-5 flex items-start gap-3">
            <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-lg mt-0.5 shrink-0 border border-indigo-500/20">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="space-y-1 mt-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Mobile Responsiveness</h4>
              <p className="text-xs text-slate-400 leading-normal">
                Eliminate sideways scrolls. Implement fluid grid layouts and touch targets larger than 44px for fluent figure pinning.
              </p>
            </div>
          </div>

          {/* Pillar 2: Core Web Vitals */}
          <div className="glass-card p-5 flex items-start gap-3">
            <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg mt-0.5 shrink-0 border border-emerald-500/20">
              <Zap className="w-4 h-4" />
            </div>
            <div className="space-y-1 mt-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Core Web Vitals</h4>
              <p className="text-xs text-slate-400 leading-normal">
                Convert heavy images to WebP. Avoid Cumulative Layout Shift (CLS) in your stylesheet using aspect-ratio presets.
              </p>
            </div>
          </div>

          {/* Pillar 3: AdSense Layouts */}
          <div className="glass-card p-5 flex items-start gap-3">
            <div className="bg-purple-500/10 text-purple-400 p-2 rounded-lg mt-0.5 shrink-0 border border-purple-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="space-y-1 mt-0.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">AdSense Placements</h4>
              <p className="text-xs text-slate-400 leading-normal">
                Secure high-yield CTR by placing responsive, flexible in-feed ad containers directly matching bento grids.
              </p>
            </div>
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 pb-px overflow-x-auto no-scrollbar gap-1.5">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-selector-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-display text-sm font-semibold transition-all whitespace-nowrap shrink-0 relative ${
                  isSelected 
                    ? "border-indigo-500 text-indigo-400 bg-white/5" 
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/5"
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isSelected ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-white/5 text-slate-500 border border-transparent"
                }`}>
                  {tab.count}
                </span>
                
                {/* Visual marker for selected tab */}
                {isSelected && (
                  <span className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Central Intersecting view */}
        <div className="min-h-[500px] transition-all duration-300">
          
          {activeTab === "sandbox" && (
            <div className="animate-fade-in">
              <RedesignStudio />
            </div>
          )}

          {activeTab === "calculator" && (
            <div className="animate-fade-in">
              <RevenueCalculator />
            </div>
          )}

          {activeTab === "ai" && (
            <div className="animate-fade-in">
              <AIAdvisor />
            </div>
          )}

          {activeTab === "blueprints" && (
            <div className="animate-fade-in">
              <CodeBlueprint />
            </div>
          )}

        </div>

        {/* Detailed Strategic Action Blueprint Banner */}
        <div className="p-6 glass-card space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="text-base font-bold text-slate-100 font-display">Step-by-Step Optimization Strategy</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-white/[0.015] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all rounded-xl space-y-2">
              <div className="font-bold text-indigo-400 tracking-wide font-display">1. Clean Asset Conversions</div>
              <p className="text-slate-400 leading-normal">Compress heavy original figure images to .webp. Use CSS aspect-ratio configurations (1:1 / 4:3) so paint times drop below 0.8s.</p>
            </div>
            <div className="p-4 bg-white/[0.015] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all rounded-xl space-y-2">
              <div className="font-bold text-indigo-400 tracking-wide font-display">2. Adaptive Ad Wrappers</div>
              <p className="text-slate-400 leading-normal">Stop layout jumps! Secure dynamic ad sizing wrappers using CSS min-height rules so scripts do not displace figure lists.</p>
            </div>
            <div className="p-4 bg-white/[0.015] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all rounded-xl space-y-2">
              <div className="font-bold text-indigo-400 tracking-wide font-display">3. Smooth Pinterest Hooks</div>
              <p className="text-slate-400 leading-normal">Support easy, fluid, single-click Pinterest creations on mobile cards, directly deep-linking custom share payloads to apps.</p>
            </div>
            <div className="p-4 bg-white/[0.015] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all rounded-xl space-y-2">
              <div className="font-bold text-indigo-400 tracking-wide font-display">4. Lazy Load Placements</div>
              <p className="text-slate-400 leading-normal">Implement lazy load triggers on offscreen images and in-feed ad scripts using IntersectionObservers to maintain perfect initial load scores.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-[#04060b] border-t border-slate-950 p-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-2">
          <p>FigurePinner Site Optimizer Hub &copy; {new Date().getFullYear()}</p>
          <p className="text-slate-600 font-medium">Designed for Bubs Collectibles - Empowering collectors with lightning-fast, high-converting layouts.</p>
        </div>
      </footer>
    </div>
  );
}
