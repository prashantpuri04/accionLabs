export interface Margin{
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface RevenuePoint{
    date: string;
    revenue: number;
}

export interface CategorySales{
    category: string;
    sales: number;
}

export interface TrafficSource{
    category: string;
    value: number;
}

export interface OrgNode{
    name: string;
    children: OrgNode[];
}

export interface CampaignRecord{
    id: string;
    adSpend: number;
    revenue: number;
    channel?: string;
}

export interface TooltipState {
  x: number;
  y: number;
  title: string;
  lines: string[];
}

export interface ChartCardProps{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
}

export interface ChartTooltipProps{
    tooltip: TooltipState | null;
}