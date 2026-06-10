export interface CollectibleItem {
  id: string;
  title: string;
  category: "Action Figures" | "Anime Figures" | "Funko Pop font" | "Statues" | "Lego";
  scale: string;
  image: string;
  pinCount: number;
}

export interface AuditCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export type LayoutMode = "before" | "after";
export type ViewportDevice = "mobile" | "tablet" | "desktop";

export interface AIActionItem {
  title: string;
  description: string;
  code_snippet: string;
}

export interface AICritiqueResult {
  summary: string;
  score: number;
  action_items: AIActionItem[];
  adsense_earnings_potential: string;
}
