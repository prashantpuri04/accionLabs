import { useEffect, useRef, useState } from 'react';
import { max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { scaleBand, scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import 'd3-transition';
import { useResizeObserver } from '../../../hooks/useResizeObserver';
import type { CategorySales, Margin, TooltipState } from '../../../types/charts';
import { ChartTooltip } from '../../ui/ChartTooltip';

interface Props {
  data: CategorySales[];
}

const MARGIN: Margin = { top: 28, right: 20, bottom: 68, left: 52 };

export function CategoryBarChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const hasAnimatedRef = useRef(false);
  const { width } = useResizeObserver(containerRef);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

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

    const xScale = scaleBand<string>()
      .domain(data.map((d) => d.category))
      .range([0, innerWidth])
      .padding(0.25);

    const yScale = scaleLinear()
      .domain([0, (max(data, (d) => d.sales) ?? 160) * 1.12])
      .nice()
      .range([innerHeight, 0]);

    // X-Axis with angled labels to prevent clipping/overlap
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(axisBottom(xScale))
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('transform', 'rotate(-35)')
      .style('text-anchor', 'end');

    // Y-Axis
    g.append('g')
      .call(axisLeft(yScale).ticks(5))
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-size', '12px');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -38)
      .attr('text-anchor', 'middle')
      .attr('fill', '#334155')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .text('Units Sold');

    // Bars (REQ-BAR-01, 03, 04)
    const bars = g
      .selectAll<SVGRectElement, CategorySales>('rect.bar')
      .data(data, (d) => d.category)
      .join('rect')
      .attr('class', 'bar cursor-pointer outline-none')
      .attr('x', (d) => xScale(d.category) ?? 0)
      .attr('width', xScale.bandwidth())
      .attr('rx', 4)
      .attr('fill', '#0d9488')
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => `${d.category}: ${d.sales} units`)
      .on('mouseenter focus', function (_event, d) {
        select(this).attr('fill', '#0f766e');
        const xPos = (xScale(d.category) ?? 0) + xScale.bandwidth() / 2;
        setTooltip({
          x: MARGIN.left + xPos,
          y: MARGIN.top + yScale(d.sales),
          title: d.category,
          lines: [`Sales: ${d.sales} units`],
        });
      })
      .on('mouseleave blur', function () {
        select(this).attr('fill', '#0d9488');
        setTooltip(null);
      });

    if (!hasAnimatedRef.current) {
      bars
        .attr('y', innerHeight)
        .attr('height', 0)
        .transition()
        .duration(650)
        .delay((_, i) => i * 30)
        .attr('y', (d) => yScale(d.sales))
        .attr('height', (d) => innerHeight - yScale(d.sales));
      hasAnimatedRef.current = true;
    } else {
      bars
        .attr('y', (d) => yScale(d.sales))
        .attr('height', (d) => innerHeight - yScale(d.sales));
    }

    // Value labels above bars (REQ-BAR-02)
    g.selectAll<SVGTextElement, CategorySales>('text.value-label')
      .data(data, (d) => d.category)
      .join('text')
      .attr('class', 'value-label pointer-events-none')
      .attr('x', (d) => (xScale(d.category) ?? 0) + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.sales) - 6)
      .attr('text-anchor', 'middle')
      .attr('fill', '#1e293b')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text((d) => d.sales);

    return () => {
      svg.selectAll('*').interrupt();
      setTooltip(null);
    };
  }, [data, width]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} role="img" aria-label="Sales by Product Category Bar Chart" className="block w-full" />
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}