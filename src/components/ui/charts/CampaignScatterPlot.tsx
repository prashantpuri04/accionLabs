import { useMemo } from 'react';
import { max } from 'd3-array';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { useD3Chart } from '../../../hooks/useD3Chart';
import type { CampaignRecord, Margin } from '../../../types/charts';
import {
  bindTooltipInteractions,
  renderAxes,
  renderAxisLabels,
  renderHorizontalGridlines,
} from '../../../utils/d3Helpers';
import { ChartTooltip } from '../../ui/ChartTooltip';

interface Props {
  data: CampaignRecord[];
}

const MARGIN: Margin = { top: 20, right: 24, bottom: 48, left: 56 };
const CHANNEL_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#64748b'];

export function CampaignScatterPlot({ data }: Props) {
  const channels = useMemo(
    () => Array.from(new Set(data.map((d) => d.channel ?? 'Unspecified'))),
    [data]
  );

  const colorScale = useMemo(
    () => scaleOrdinal<string, string>().domain(channels).range(CHANNEL_COLORS),
    [channels]
  );

  const { containerRef, svgRef, tooltip } = useD3Chart(
    {
      height: 340,
      margin: MARGIN,
      render: ({ g, innerWidth, innerHeight, margin, setTooltip }) => {
        if (data.length === 0) return;

        const xScale = scaleLinear()
          .domain([0, (max(data, (d) => d.adSpend) ?? 70) * 1.1])
          .nice()
          .range([0, innerWidth]);

        const yScale = scaleLinear()
          .domain([0, (max(data, (d) => d.revenue) ?? 100) * 1.1])
          .nice()
          .range([innerHeight, 0]);

        renderHorizontalGridlines(g, yScale, innerWidth);
        renderAxes(g, {
          xScale,
          yScale,
          innerHeight,
          xTicks: 6,
          yTicks: 5,
          xFormat: (d) => `$${d}k`,
          yFormat: (d) => `$${d}k`,
        });
        renderAxisLabels(g, innerWidth, innerHeight, {
          xLabel: 'Advertising Spend (USD Thousands)',
          yLabel: 'Revenue (USD Thousands)',
        });

        g.selectAll<SVGCircleElement, CampaignRecord>('circle.dot')
          .data(data, (d) => d.id)
          .join('circle')
          .attr('class', 'dot cursor-pointer stroke-white stroke-[1.5] opacity-90 outline-none')
          .attr('cx', (d) => xScale(d.adSpend))
          .attr('cy', (d) => yScale(d.revenue))
          .attr('r', 6)
          .attr('fill', (d) => colorScale(d.channel ?? 'Unspecified'))
          .call(bindTooltipInteractions, {
            ariaLabel: (d) =>
              `Campaign ${d.id}, Channel ${d.channel ?? 'Unspecified'}, Ad Spend $${d.adSpend}k, Revenue $${d.revenue}k`,
            tooltip: (d) => ({
              x: margin.left + xScale(d.adSpend),
              y: margin.top + yScale(d.revenue),
              title: `Campaign ${d.id}`,
              lines: [
                `Channel: ${d.channel ?? 'Unspecified'}`,
                `Ad Spend: $${d.adSpend}k`,
                `Revenue: $${d.revenue}k`,
              ],
            }),
            setTooltip,
            onActive: (el) => el.attr('r', 8.5).classed('opacity-100', true),
            onInactive: (el) => el.attr('r', 6).classed('opacity-100', false),
          });
      },
    },
    [data, colorScale]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="mb-2 flex flex-wrap justify-end gap-4 text-xs" aria-label="Channel legend">
        {channels.map((channel) => (
          <div key={channel} className="flex items-center gap-1.5 text-slate-700">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colorScale(channel) }}
              aria-hidden="true"
            />
            <span>{channel}</span>
          </div>
        ))}
      </div>

      <svg
        ref={svgRef}
        role="img"
        aria-label="Advertising Spend vs Revenue Scatter Plot"
        className="block w-full"
      />
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}