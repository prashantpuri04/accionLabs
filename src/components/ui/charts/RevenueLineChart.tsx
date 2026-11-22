import { useEffect, useRef, useState } from 'react';
import { extent, max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleLinear, scaleTime } from 'd3-scale';
import { select } from 'd3-selection';
import { curveMonotoneX, line } from 'd3-shape';
import { timeFormat, timeParse } from 'd3-time-format';
import { useResizeObserver } from '../../../hooks/useResizeObserver';
import type { Margin, RevenuePoint, TooltipState } from '../../../types/charts';
import { ChartTooltip } from '../../ui/ChartTooltip';

interface Props {
  data: RevenuePoint[];
}

interface ParsedPoint {
  date: Date;
  rawDate: string;
  revenue: number;
}

const MARGIN: Margin = { top: 20, right: 24, bottom: 44, left: 56 };

export function RevenueLineChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width } = useResizeObserver(containerRef);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || width === 0 || data.length === 0) return;

    const height = 320;
    const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
    const innerHeight = Math.max(0, height - MARGIN.top - MARGIN.bottom);

    const parseDate = timeParse('%Y-%m-%d');
    const formatMonth = timeFormat('%b %Y');

    const parsed: ParsedPoint[] = data
      .map((d) => ({ date: parseDate(d.date), rawDate: d.date, revenue: d.revenue }))
      .filter((d): d is ParsedPoint => d.date !== null);

    const svg = select(svgEl);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const [minDate, maxDate] = extent(parsed, (d) => d.date);
    if (!minDate || !maxDate) return;

    const xScale = scaleTime().domain([minDate, maxDate]).range([0, innerWidth]);
    const yScale = scaleLinear()
      .domain([0, (max(parsed, (d) => d.revenue) ?? 100) * 1.1])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal gridlines (REQ-LINE-02)
    g.append('g')
      .attr('class', 'grid')
      .call(axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => ''))
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('line').attr('stroke', '#e2e8f0').attr('stroke-dasharray', '3,3'));

    // X & Y Axes
    const tickCount = width < 500 ? 4 : 6;
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(axisBottom<Date>(xScale).ticks(tickCount).tickFormat(timeFormat('%b')))
      .call((sel) => sel.selectAll('text').attr('fill', '#475569').attr('font-size', '12px'));

    g.append('g')
      .call(axisLeft(yScale).ticks(5).tickFormat((d) => `$${d}k`))
      .call((sel) => sel.selectAll('text').attr('fill', '#475569').attr('font-size', '12px'));

    // Y-axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -42)
      .attr('text-anchor', 'middle')
      .attr('fill', '#334155')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text('Revenue (USD Thousands)');

    // Line generator (REQ-LINE-02)
    const lineGen = line<ParsedPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.revenue))
      .curve(curveMonotoneX);

    g.append('path')
      .datum(parsed)
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2.5)
      .attr('d', lineGen);

    // Interactive Data Markers (REQ-LINE-03)
    g.selectAll<SVGCircleElement, ParsedPoint>('circle.point')
      .data(parsed, (d) => d.rawDate)
      .join('circle')
      .attr('class', 'point cursor-pointer outline-none')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) => yScale(d.revenue))
      .attr('r', 5)
      .attr('fill', '#2563eb')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => `${formatMonth(d.date)}: $${d.revenue}k`)
      .on('mouseenter focus', function (_event, d) {
        select(this).attr('r', 7).attr('fill', '#1d4ed8');
        setTooltip({
          x: MARGIN.left + xScale(d.date),
          y: MARGIN.top + yScale(d.revenue),
          title: formatMonth(d.date),
          lines: [`Revenue: $${d.revenue}k`],
        });
      })
      .on('mouseleave blur', function () {
        select(this).attr('r', 5).attr('fill', '#2563eb');
        setTooltip(null);
      });

    return () => {
      svg.selectAll('*').interrupt();
      setTooltip(null);
    };
  }, [data, width]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} role="img" aria-label="Monthly Revenue Time-Series Line Chart" className="block w-full" />
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}