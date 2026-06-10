import { useState, useMemo } from "react";
import { 
  TrendingUp, 
  Zap, 
  DollarSign, 
  Users, 
  Percent, 
  HelpCircle,
  PiggyBank,
  CheckCircle,
  HelpCircle as QuestionIcon
} from "lucide-react";

export default function RevenueCalculator() {
  const [pageviews, setPageviews] = useState<number>(50000);
  const [loadTime, setLoadTime] = useState<number>(4.2); // seconds
  const [selectedCTR, setSelectedCTR] = useState<number>(0.5); // %
  const [cpmRate, setCpmRate] = useState<number>(8.0); // $ CPM (Cost Per Thousand)
  const [optimizedAds, setOptimizedAds] = useState<boolean>(true);

  // Computations
  const results = useMemo(() => {
    // 1. Estimate bounce rate based on load time:
    // 1 second => ~25% bounce
    // 4 seconds => ~75% bounce
    // 8 seconds => ~95% bounce
    const calculatedBounce = Math.min(
      98,
      Math.max(20, Math.round(20 + loadTime * 14.5))
    );

    // 2. Active user volume who don't bounce (retained traffic)
    const retainedTraffic = pageviews * (1 - calculatedBounce / 100);

    // 3. Simulated CTA conversions (Pins clicked)
    // Mobile responsiveness / better UI increases base conversion from 1.5% to 6.3%
    const baseConversionRate = optimizedAds ? 0.065 : 0.018;
    const estimatedPins = Math.round(retainedTraffic * baseConversionRate);

    // 4. Monthly AdSense Earnings
    // In unoptimized mode, CTR is small (e.g. 0.5%). Optimized layouts place ads in active viewing columns boosting effective CTR by 3.5x
    const activeCTRMultiplier = optimizedAds ? 3.4 : 1.0;
    const effectiveCTR = (selectedCTR / 100) * activeCTRMultiplier;
    
    // Incomes = (Pageviews * (1 - bounce decrease)) * CTR * CPM
    // Many ad impressions can trigger per pageview as well, let's assume 2 ad Slots per page
    const adClicks = pageviews * 2 * effectiveCTR;
    const monthlyAdEarnings = (pageviews / 1000) * cpmRate * (optimizedAds ? 2.5 : 1.0);

    return {
      bounceRate: calculatedBounce,
      retainedTraffic: Math.round(retainedTraffic),
      estimatedPins,
      monthlyEarnings: Math.round(monthlyAdEarnings),
      earningsLift: Math.round(monthlyAdEarnings * 1.5), // Simulated gains compared to unoptimized base
    };
  }, [pageviews, loadTime, selectedCTR, cpmRate, optimizedAds]);

  const formatting = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div id="calculator-section" className="glass-card p-6 space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-400" />
        <h3 className="text-xl font-bold text-slate-100 font-display tracking-tight">Conversion & AdSense Estimator</h3>
      </div>

      <p className="text-sm text-slate-300 font-sans">
        Adjust the speed and traffic variables below to estimate the direct monetary correlation of implementing a lightweight design and optimized ad layouts.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Sliders Area */}
        <div className="md:col-span-6 space-y-5 bg-white/[0.02] p-5 rounded-xl border border-white/5 shadow-inner">
          
          {/* Slider 1: Monthly Traffic */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Monthly Pageviews
              </span>
              <span className="text-indigo-400 text-sm font-mono">{formatting(pageviews)}</span>
            </div>
            <input 
              type="range" 
              min={10000} 
              max={500000} 
              step={10000}
              value={pageviews}
              onChange={(e) => setPageviews(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slider 2: Load Time */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-slate-400" />
                Average Loading Speed
              </span>
              <span className={`text-sm font-mono ${loadTime < 1.0 ? "text-emerald-400" : loadTime < 3.0 ? "text-yellow-400" : "text-rose-400"}`}>
                {loadTime.toFixed(1)}s
              </span>
            </div>
            <input 
              type="range" 
              min={0.4} 
              max={8.0} 
              step={0.1}
              value={loadTime}
              onChange={(e) => setLoadTime(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.4s (Vite + WebP CDN)</span>
              <span>8.0s (Cluttered/Slow)</span>
            </div>
          </div>

          {/* Slider 3: AdSense CTR */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-slate-400" />
                Baseline AdSense CTR
              </span>
              <span className="text-indigo-400 text-sm font-mono">{selectedCTR.toFixed(1)}%</span>
            </div>
            <input 
              type="range" 
              min={0.1} 
              max={6.0} 
              step={0.1}
              value={selectedCTR}
              onChange={(e) => setSelectedCTR(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.1% (Buried Ads)</span>
              <span>6.0% (High Click Density)</span>
            </div>
          </div>

          {/* Slider 4: AdSense CPM / Page RPM */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Page RPM / CPM
              </span>
              <span className="text-indigo-400 text-sm font-mono">${cpmRate.toFixed(2)}</span>
            </div>
            <input 
              type="range" 
              min={2.00} 
              max={40.00} 
              step={0.50}
              value={cpmRate}
              onChange={(e) => setCpmRate(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>$2.00 (Low niche value)</span>
              <span>$40.00 (Warm collectible buyers)</span>
            </div>
          </div>

          {/* Toggle: Active Optimized Placements */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200">Enable Smart Ad Placements</div>
              <div className="text-[10px] text-slate-400">Implement in-feed bento grids + sticky lazy anchor rules</div>
            </div>
            <button
              id="btn-toggle-smart-ads"
              onClick={() => setOptimizedAds(p => !p)}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${optimizedAds ? "bg-indigo-600" : "bg-slate-800"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${optimizedAds ? "right-1" : "left-1"}`} />
            </button>
          </div>

        </div>

        {/* Results Area */}
        <div className="md:col-span-6 grid grid-cols-2 gap-4">
          
          {/* Grid 1: Bounce Rate */}
          <div className="bg-white/[0.015] p-4 rounded-xl border border-white/5 flex flex-col justify-between shadow-inner">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase font-display">Simulated Bounce</span>
            <div className="my-2">
              <div className={`text-2xl md:text-3xl font-extrabold font-mono ${results.bounceRate > 65 ? "text-rose-400" : results.bounceRate > 40 ? "text-yellow-400" : "text-emerald-400"}`}>
                {results.bounceRate}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-sans">
                {results.bounceRate > 65 ? "❌ 2 out of 3 leave on load" : "✅ Excellent viewer holding rate"}
              </div>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1 border border-white/5">
              <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${100 - results.bounceRate}%` }} />
            </div>
          </div>

          {/* Grid 2: Retained Trafffic */}
          <div className="bg-white/[0.015] p-4 rounded-xl border border-white/5 flex flex-col justify-between shadow-inner">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase font-display">Retained Visitors</span>
            <div className="my-2">
              <div className="text-2xl md:text-3xl font-extrabold font-mono text-slate-200">
                {formatting(results.retainedTraffic)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1 font-sans">Active buyers browsing pins</span>
            </div>
            <div className="text-[10px] text-emerald-400/95 font-bold font-sans">
              +{(100 - results.bounceRate).toFixed(0)}% interactive core
            </div>
          </div>

          {/* Grid 3: Pin Saves (CTC Shares) */}
          <div className="bg-white/[0.015] p-4 rounded-xl border border-white/5 flex flex-col justify-between shadow-inner">
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase font-display">Monthly Pin Saves</span>
            <div className="my-2">
              <div className="text-2xl md:text-3xl font-extrabold font-mono text-indigo-400">
                {formatting(results.estimatedPins)}
              </div>
              <span className="text-[10px] text-slate-400 block mt-1 font-sans">Direct viral growth drivers</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              CTR Spike: <strong className="text-indigo-400">{optimizedAds ? "+260%" : "Baseline"}</strong>
            </div>
          </div>

          {/* Grid 4: AdSense Income Block */}
          <div className="bg-gradient-to-br from-indigo-950/25 to-purple-950/25 p-4 rounded-xl border border-indigo-500/15 flex flex-col justify-between shadow-inner">
            <span className="text-[11px] font-bold tracking-widest text-indigo-400 uppercase flex items-center gap-1 font-display">
              <DollarSign className="w-3 h-3 text-indigo-400" />
              AdSense Monthly
            </span>
            <div className="my-2">
              <div className="text-2xl md:text-3xl font-extrabold font-mono text-emerald-400 animate-pulse">
                ${formatting(results.monthlyEarnings)}
              </div>
              <span className="text-[9px] text-slate-400 block mt-1 font-sans font-medium">Estimated monetization value</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-950/20 w-fit font-sans">
              <TrendingUp className="w-3 h-3" />
              <span>~3.5x CTR Lift</span>
            </div>
          </div>

        </div>

      </div>

      <div className="p-4 bg-white/[0.015] text-xs rounded-xl border border-white/5 flex items-start gap-2 text-slate-300 shadow-inner">
        <QuestionIcon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed font-sans">
          <strong>Monetization Note:</strong> AdSense revenue is directly harmed by poor mobile loading scores because scripts are blocked, layout shifts scare viewers, and users bounce back to search. Moving from <strong>4.2s to 0.6s</strong> loading and installing native <strong>In-Feed ads</strong> creates stable Cumulative Layout Shift (CLS), generating maximum yield with minimum friction.
        </div>
      </div>
    </div>
  );
}
