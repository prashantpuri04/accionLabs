import { useEffect, useMemo, useRef, useState } from 'react';
import { sum } from 'd3-array';
import { scaleOrdinal } from 'd3-scale';
import { schemeTableau10 } from 'd3-scale-chromatic';
import { select } from 'd3-selection';
import { arc, pie, type PieArcDatum } from 'd3-shape';
import { useResizeObserver } from '../../../hooks/useResizeObserver';
import type { TooltipState, TrafficSource } from '../../../types/charts';
import { ChartTooltip } from '../../ui/ChartTooltip';

interface Props {
  data: TrafficSource[];
}

export function TrafficDonutChart({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width } = useResizeObserver(containerRef);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const total = useMemo(() => sum(data, (d) => d.value), [data]);

  const colorScale = useMemo(
    () => scaleOrdinal<string, string>().domain(data.map((d) => d.category)).range(schemeTableau10),
    [data]
  );

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || width === 0 || data.length === 0) return;

    const chartSize = Math.min(width, 300);
    const radius = chartSize / 2;
    const innerRadius = radius * 0.56;
    const outerRadius = radius * 0.9;

    const svg = select(svgEl);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', chartSize)
      .attr('height', chartSize)
      .append('g')
      .attr('transform', `translate(${radius},${radius})`);

    const pieGen = pie<TrafficSource>()
      .value((d) => d.value)
      .sort(null);

    const arcGen = arc<PieArcDatum<TrafficSource>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .padAngle(0.02)
      .cornerRadius(4);

    const arcs = pieGen(data);

    g.selectAll<SVGPathElement, PieArcDatum<TrafficSource>>('path.slice')
      .data(arcs, (d) => d.data.category)
      .join('path')
      .attr('class', 'slice cursor-pointer outline-none transition-opacity')
      .attr('d', arcGen)
      .attr('fill', (d) => colorScale(d.data.category))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('tabindex', 0)
      .attr('role', 'button')
      .attr('aria-label', (d) => {
        const pct = total > 0 ? ((d.data.value / total) * 100).toFixed(1) : '0';
        return `${d.data.category}: ${d.data.value} (${pct}%)`;
      })
      .on('mouseenter focus', function (_event, d) {
        select(this).attr('opacity', 0.85);
        const [cx, cy] = arcGen.centroid(d);
        const pct = total > 0 ? ((d.data.value / total) * 100).toFixed(1) : '0';
        setTooltip({
          x: radius + cx,
          y: radius + cy,
          title: d.data.category,
          lines: [`Value: ${d.data.value}`, `Share: ${pct}%`],
        });
      })
      .on('mouseleave blur', function () {
        select(this).attr('opacity', 1);
        setTooltip(null);
      });

    // Percentage labels on larger slices
    g.selectAll<SVGTextElement, PieArcDatum<TrafficSource>>('text.slice-label')
      .data(arcs.filter((d) => d.data.value / total >= 0.08))
      .join('text')
      .attr('class', 'slice-label pointer-events-none')
      .attr('transform', (d) => `translate(${arcGen.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#ffffff')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .text((d) => `${Math.round((d.data.value / total) * 100)}%`);

    return () => {
      svg.selectAll('*').interrupt();
      setTooltip(null);
    };
  }, [data, width, total, colorScale]);

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
      <div className="relative">
        <svg ref={svgRef} role="img" aria-label="Website Traffic Sources Donut Chart" />
        <ChartTooltip tooltip={tooltip} />
      </div>

      {/* Tailwind Legend (REQ-PIE-02) */}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-1" aria-label="Traffic source legend">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <li key={item.category} className="flex items-center gap-2 text-slate-700">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: colorScale(item.category) }}
                aria-hidden="true"
              />
              <span className="font-medium">{item.category}</span>
              <span className="ml-auto text-slate-500">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}