
import './App.css'
import { RevenueLineChart } from './components/ui/charts/RevenueLineChart'
import { CampaignScatterPlot } from './components/ui/charts/CampaignScatterPlot'
import type { RevenuePoint,CategorySales, TrafficSource,CampaignRecord,OrgNode  } from './types/charts'
import revenueData from './data/revenue.json'
import { ChartCard } from './components/ui/ChartCard'
import trafficSourceData from './data/trafficSources.json'
import categorySalesData from './data/categorySales.json'
import companyTreeData from './data/companyTree.json'
import campaignsData from './data/campaigns.json'
import { CategoryBarChart } from './components/ui/charts/CategoryBarChart'
import { TrafficDonutChart } from './components/ui/charts/TrafficDonutChart'
import { CompanyTidyTree } from './components/ui/charts/CompanyTidyTree'

function App() {
  

  return (
    <>
      <ChartCard title="Monthly Revenue (2025)"
            subtitle="Monthly recurring performance in USD thousands">
            <RevenueLineChart data={revenueData as RevenuePoint[]} />
      </ChartCard>

           <ChartCard
            title="Sales by Product Category"
            subtitle="Total units sold across twelve product lines"
          >
            <CategoryBarChart data={categorySalesData as CategorySales[]} />
          </ChartCard> 

          <ChartCard
            title="Website Traffic Sources"
            subtitle="Acquisition channel distribution (%)"
          >
            <TrafficDonutChart data={trafficSourceData as TrafficSource[]} />
          </ChartCard> 

          <ChartCard
            title="Advertising Spend vs. Revenue"
            subtitle="Campaign efficiency segmented by acquisition channel"
          >
            <CampaignScatterPlot data={campaignsData as CampaignRecord[]} />
          </ChartCard> 

           <ChartCard
            title="Company Structure"
            subtitle="Click any parent node to collapse or expand branches"
            className="lg:col-span-2"
          >
            <CompanyTidyTree data={companyTreeData as OrgNode} />
          </ChartCard> 
    
    </>
  )
}

export default App
