import { useState } from "react";
import { 
  Code2, 
  Copy, 
  Check, 
  Zap, 
  Layout, 
  Pin, 
  Monitor,
  Eye
} from "lucide-react";

interface SnippetItem {
  id: string;
  title: string;
  category: "Layout" | "AdSense" | "Performance" | "Pinterest";
  tagline: string;
  description: string;
  code: string;
}

const BLUEPRINT_SNIPPETS: SnippetItem[] = [
  {
    id: "sn-adsense-holder",
    title: "Layout-Shift Proof AdSense Container",
    category: "AdSense",
    tagline: "Block Cumulative Layout Shift (CLS)",
    description: "Force containers to reserve space (with minor placeholder borders/backgrounds) *before* the asynchronous Google AdSense script paints. This improves your site's PageSpeed Core Web Vitals instantly.",
    code: `<!-- Drop this wrapper around your AdSense unit to secure layout stability -->
<div class="adsense-slot-container my-4 flex flex-col items-center">
  <!-- Small, professional attribution -->
  <span class="text-[9px] text-gray-400 font-mono tracking-widest uppercase mb-1">Sponsored Advertisement</span>
  
  <!-- Content height locked on mobile to avoid jumping content once painted -->
  <div class="w-full min-h-[250px] sm:min-h-[90px] bg-gray-50/50 rounded-xl border border-dashed border-gray-200/60 leading-none flex items-center justify-center relative overflow-hidden">
    
    <!-- YOUR GOOGLE ADSENSE SCRIPT HERE -->
    <ins class="adsbygoogle"
         style="display:block"
         data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
         data-ad-slot="XXXXXXXXXX"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
    <script>
         (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
    
  </div>
</div>`
  },
  {
    id: "sn-bento-grid",
    title: "Mobile-First Bento Collectibles Grid",
    category: "Layout",
    tagline: "Ultra-responsive CSS layout for figure lists",
    description: "Clean mobile-first grid wrapper featuring dynamic cards, touch-safe paddings, and automatic spacing for inline in-feed sponsored blocks.",
    code: `/* Responsive bento layouts in Tailwind CSS for your figures list */
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 md:p-6">
  
  <!-- Figure Card template -->
  <div class="bg-white rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all duration-300 p-4 flex flex-col justify-between">
    <div>
      <div class="flex justify-between items-start">
        <span class="text-[9px] font-bold text-slate-800 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded">Action Figures</span>
        <span class="text-[10px] text-gray-400 font-mono">1:6 Scale</span>
      </div>
      
      <!-- Aspect ratio locked media placeholder to prevent layout shifts -->
      <div class="aspect-square w-full bg-gray-55/80 rounded-lg mt-3 flex items-center justify-center overflow-hidden">
        <img src="your-figure-webp-compression.webp" alt="Amazing collectible" class="object-cover w-full h-full hover:scale-105 transition-transform duration-300" loading="lazy">
      </div>
      
      <h3 class="mt-3 font-bold text-gray-900 text-sm tracking-tight">Spider-Man Classic Edition</h3>
    </div>
    
    <div class="pt-3 border-t border-gray-50 mt-4 flex items-center justify-between">
      <div class="flex items-center gap-1 text-[11px] text-gray-500">
        <span>📌 2,410 pins</span>
      </div>
      <button class="bg-red-500 hover:bg-red-650 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-md transition-colors flex items-center gap-1">
        <span>Pin to Board</span>
      </button>
    </div>
  </div>

</div>`
  },
  {
    id: "sn-lazy-images",
    title: "Image Performance Hook (WebP Loader)",
    category: "Performance",
    tagline: "Improve LCP (Largest Contentful Paint)",
    description: "A vanilla JavaScript module that implements standard lazy loadings for figures. It detects viewports via standard IntersectionObservers, avoiding costly layout freezes on slower 3G cell connections.",
    code: `// Lightweight observer to lazy load images & lazy paint Adsense units on scroll
document.addEventListener("DOMContentLoaded", () => {
  const lazyMediaElements = [].slice.call(document.querySelectorAll("img.lazy-load, .lazy-ad"));

  if ("IntersectionObserver" in window) {
    let lazyObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          let element = entry.target;
          if (element.tagName === "IMG") {
            element.src = element.dataset.src;
            element.classList.remove("lazy-load");
          } else {
            // Lazy trigger of AdSense push script
            try {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            } catch (e) {
              console.log("AdSense loaded dynamically");
            }
          }
          lazyObserver.unobserve(element);
        }
      });
    });

    lazyMediaElements.forEach((element) => {
      lazyObserver.observe(element);
    });
  }
});`
  },
  {
    id: "sn-pinterest-api",
    title: "Single-Click Pin Share Handler",
    category: "Pinterest",
    tagline: "Accelerate your viral Pinterest referrals",
    description: "Streamlined share logic to quickly trigger Pinterest boards. It safely pushes your product image data and custom target description directly into their mobile flow.",
    code: `// Simple Pinterest referral sharing trigger for FigurePinner
const triggerPinterestPin = (figureTitle, imageUrl, pageUrl) => {
  const baseShareUrl = "https://www.pinterest.com/pin/create/button/";
  
  // Custom encoded description targeting anime & figures fans
  const description = encodeURIComponent(\`Check out \${figureTitle} on FigurePinner! Find rare collectibles, boards and hot toys.\`);
  const encodedImage = encodeURIComponent(imageUrl);
  const encodedPage = encodeURIComponent(pageUrl || window.location.href);
  
  const targetUrl = \`\${baseShareUrl}?url=\${encodedPage}&media=\${encodedImage}&description=\${description}\`;
  
  // Safe responsive window trigger
  if (window.innerWidth < 640) {
    // Mobile: open app / deep link support
    window.location.href = targetUrl;
  } else {
    // Desktop: popup
    const width = 600;
    const height = 500;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      targetUrl,
      "PinterestPinRequest",
      \`width=\${width},height=\${height},left=\${left},top=\${top},resizable=yes,scrollbars=yes\`
    );
  }
};`
  }
];

export default function CodeBlueprint() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSnippetIndex, setActiveSnippetIndex] = useState<number>(0);

  const handleCopy = (id: string, codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const activeSnippet = BLUEPRINT_SNIPPETS[activeSnippetIndex];

  return (
    <div id="blueprints-section" className="glass-card p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
      
      {/* Selector Menu */}
      <div className="md:col-span-4 space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-400" />
          <h3 className="text-xl font-bold text-slate-100 font-display tracking-tight">Code Blueprint Library</h3>
        </div>

        <p className="text-xs text-slate-300 max-w-sm font-sans">
          Select any of the curated production-ready code modules below to display their direct code configuration. Copy and paste them into your code structure.
        </p>

        <div className="space-y-2 pt-2">
          {BLUEPRINT_SNIPPETS.map((sn, idx) => (
            <button
              key={sn.id}
              onClick={() => setActiveSnippetIndex(idx)}
              className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between ${
                activeSnippetIndex === idx 
                  ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.1)]" 
                  : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
              }`}
            >
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200 font-sans">{sn.title}</div>
                <div className="text-[10px] text-slate-400 font-medium font-sans">{sn.tagline}</div>
              </div>
              
              <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                sn.category === "AdSense" ? "bg-indigo-950/80 text-indigo-300 border border-indigo-500/20" :
                sn.category === "Performance" ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/20" :
                sn.category === "Layout" ? "bg-sky-950/80 text-sky-300 border border-sky-500/20" : "bg-purple-950/80 text-purple-300 border border-purple-500/20"
              }`}>
                {sn.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Code Display Area */}
      <div className="md:col-span-8 flex flex-col justify-between bg-black/40 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden min-h-[420px] shadow-2xl">
        
        {/* Snippet Header */}
        <div className="p-4 bg-black/20 border-b border-white/5 flex justify-between items-center text-xs">
          <div className="space-y-1">
            <h4 className="font-extrabold text-indigo-300 text-sm font-display">{activeSnippet.title}</h4>
            <p className="text-slate-300 text-xs font-normal leading-relaxed font-sans">{activeSnippet.description}</p>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 p-4 overflow-auto max-h-[300px] text-[11px] font-mono text-slate-300 bg-black/10 leading-relaxed select-text">
          <pre><code>{activeSnippet.code}</code></pre>
        </div>

        {/* Actions bar */}
        <div className="p-3 bg-white/[0.01] border-t border-white/5 flex justify-between items-center text-xs">
          <span className="text-[10px] text-slate-500 font-mono">
            Requires {activeSnippet.category === "Layout" ? "Tailwind v4 / v3" : "Standard HTML5/ES6"}
          </span>
          
          <button
            id={`btn-copy-${activeSnippet.id}`}
            onClick={() => handleCopy(activeSnippet.id, activeSnippet.code)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white font-bold px-4 py-1.5 rounded-lg shadow-lg hover:bg-indigo-500 hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 font-sans"
          >
            {copiedId === activeSnippet.id ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Code
              </>
            )}
          </button>
        </div>

      </div>

    </div>
  );
}
