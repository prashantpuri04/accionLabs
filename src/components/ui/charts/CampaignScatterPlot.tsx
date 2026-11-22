import { useEffect, useMemo, useRef, useState } from 'react';
import { max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { select } from 'd3-selection';
import { useResizeObserver } from '../../../hooks/useResizeObserver';
import type { CampaignRecord, Margin, TooltipState } from '../../../types/charts';
import { ChartTooltip } from '../../ui/ChartTooltip';

interface Props {
  data: CampaignRecord[];
}

const MARGIN: Margin = { top: 20, right: 24, bottom: 48, left: 56 };
const CHANNEL_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#9333ea', '#64748b'];

export function CampaignScatterPlot({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width } = useResizeObserver(containerRef);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const channels = useMemo(
    () => Array.from(new Set(data.map((d) => d.channel ?? 'Unspecified'))),
    [data]
  );

  const colorScale = useMemo(
    () => scaleOrdinal<string, string>().domain(channels).range(CHANNEL_COLORS),
    [channels]
  );

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || width === 0 || data.length === 0) return;

    const height = 340;
    const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
    const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

    const svg = select(svgEl);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const xScale = scaleLinear()
      .domain([0, (max(data, (d) => d.adSpend) ?? 70) * 1.1])
      .nice()
      .range([0, innerWidth]);

    const yScale = scaleLinear()
      .domain([0, (max(data, (d) => d.revenue) ?? 100) * 1.1])
      .nice()
      .range([innerHeight, 0]);

    // Gridlines
    g.append('g')
      .call(axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => ''))
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').attr('stroke', '#e2e8f0').attr('stroke-dasharray', '3,3'));

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(axisBottom(xScale).ticks(6).tickFormat((d) => `$${d}k`))
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', '12px');

    g.append('g')
      .call(axisLeft(yScale).ticks(5).tickFormat((d) => `$${d}k`))
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', '12px');

    // Axis Titles
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#334155')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text('Advertising Spend (USD Thousands)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#334155')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text('Revenue (USD Thousands)');

    // Scatter Points (REQ-SCATTER-01, 02, 03)
    g.selectAll<SVGCircleElement, CampaignRecord>('circle.dot')
      .data(data, (d) => d.id)
      .join('circle')
      .attr('class', 'dot cursor-pointer outline-none')
      .attr('cx', (d) => xScale(d.adSpend))
      .attr('cy', (d) => yScale(d.revenue))
      .attr('r', 6)
      .attr('fill', (d) => colorScale(d.channel ?? 'Unspecified'))
      .attr('fill-opacity', 0.88)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.5)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr(
        'aria-label',
        (d) =>
          `Campaign ${d.id}, Channel ${d.channel ?? 'Unspecified'}, Ad Spend $${d.adSpend}k, Revenue $${d.revenue}k`
      )
      .on('mouseenter focus', function (_event, d) {
        select(this).attr('r', 8.5).attr('fill-opacity', 1);
        setTooltip({
          x: MARGIN.left + xScale(d.adSpend),
          y: MARGIN.top + yScale(d.revenue),
          title: `Campaign ${d.id}`,
          lines: [
            `Channel: ${d.channel ?? 'Unspecified'}`,
            `Ad Spend: $${d.adSpend}k`,
            `Revenue: $${d.revenue}k`,
          ],
        });
      })
      .on('mouseleave blur', function () {
        select(this).attr('r', 6).attr('fill-opacity', 0.88);
        setTooltip(null);
      });

    return () => {
      svg.selectAll('*').interrupt();
      setTooltip(null);
    };
  }, [data, width, colorScale]);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Category Legend (REQ-SCATTER-02) */}
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