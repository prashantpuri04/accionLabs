import { useMemo } from 'react';
import { sum } from 'd3-array';
import { scaleOrdinal } from 'd3-scale';
import { schemeTableau10 } from 'd3-scale-chromatic';
import { arc, pie, type PieArcDatum } from 'd3-shape';
import { useD3Chart } from '../../../hooks/useD3Chart';
import type { Margin, TooltipState, TrafficSource } from '../../../types/charts';
import { bindTooltipInteractions } from '../../../utils/d3Helpers';
import { ChartTooltip } from '../../ui/ChartTooltip';

interface Props {
  data: TrafficSource[];
}

const ZERO_MARGIN: Margin = { top: 0, right: 0, bottom: 0, left: 0 };

export function TrafficDonutChart({ data }: Props) {
  const total = useMemo(() => sum(data, (d) => d.value), [data]);

  const colorScale = useMemo(
    () =>
      scaleOrdinal<string, string>()
        .domain(data.map((d) => d.category))
        .range(schemeTableau10),
    [data]
  );

  const { containerRef, svgRef, tooltip } = useD3Chart(
    {
      height: 290,
      margin: ZERO_MARGIN,
      render: ({ svg, width, height, setTooltip }) => {
        if (data.length === 0) return;

        const size = Math.min(width, height, 290);
        const radius = size / 2;

        svg.attr('width', size).attr('height', size);

        const g = svg
          .select('g')
          .attr('transform', `translate(${radius},${radius})`);

        const pieGen = pie<TrafficSource>()
          .value((d) => d.value)
          .sort(null);

        const arcGen = arc<PieArcDatum<TrafficSource>>()
          .innerRadius(radius * 0.56)
          .outerRadius(radius * 0.9)
          .padAngle(0.02)
          .cornerRadius(4);

        const arcs = pieGen(data);
        const formatPct = (val: number) => (total > 0 ? ((val / total) * 100).toFixed(1) : '0');

        g.selectAll<SVGPathElement, PieArcDatum<TrafficSource>>('path.slice')
          .data(arcs, (d) => d.data.category)
          .join('path')
          .attr('class', 'slice cursor-pointer stroke-white stroke-2 outline-none transition-opacity')
          .attr('d', arcGen)
          .attr('fill', (d) => colorScale(d.data.category))
          .call(bindTooltipInteractions, {
            ariaLabel: (d) => `${d.data.category}: ${d.data.value} (${formatPct(d.data.value)}%)`,
            tooltip: (d): TooltipState => {
              const [cx, cy] = arcGen.centroid(d);
              return {
                x: radius + cx,
                y: radius + cy,
                title: d.data.category,
                lines: [`Value: ${d.data.value}`, `Share: ${formatPct(d.data.value)}%`],
              };
            },
            setTooltip,
            onActive: (el) => el.attr('opacity', 0.82),
            onInactive: (el) => el.attr('opacity', 1),
          });

        g.selectAll<SVGTextElement, PieArcDatum<TrafficSource>>('text.slice-label')
          .data(arcs.filter((d) => total > 0 && d.data.value / total >= 0.08))
          .join('text')
          .attr('class', 'slice-label pointer-events-none fill-white text-[11px] font-bold')
          .attr('transform', (d) => `translate(${arcGen.centroid(d)})`)
          .attr('text-anchor', 'middle')
          .attr('dy', '0.35em')
          .text((d) => `${Math.round((d.data.value / total) * 100)}%`);
      },
    },
    [data, total, colorScale]
  );

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around"
    >
      <div className="relative">
        <svg ref={svgRef} role="img" aria-label="Website Traffic Sources Donut Chart" />
        <ChartTooltip tooltip={tooltip} />
      </div>

      <ul
        className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-1"
        aria-label="Traffic source legend"
      >
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