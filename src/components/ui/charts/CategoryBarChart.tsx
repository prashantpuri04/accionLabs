import { useRef } from 'react';
import { max } from 'd3-array';
import { scaleBand, scaleLinear } from 'd3-scale';
import 'd3-transition';
import { useD3Chart } from '../../../hooks/useD3Chart';
import type { CategorySales, Margin } from '../../../types/charts';
import {
  bindTooltipInteractions,
  renderAxes,
  renderAxisLabels,
  renderHorizontalGridlines,
} from '../../../utils/d3Helpers';
import { ChartTooltip } from '../../ui/ChartTooltip';

interface Props {
  data: CategorySales[];
}

const MARGIN: Margin = { top: 28, right: 20, bottom: 68, left: 52 };

export function CategoryBarChart({ data }: Props) {
  const hasAnimatedRef = useRef(false);

  const { containerRef, svgRef, tooltip } = useD3Chart(
    {
      height: 340,
      margin: MARGIN,
      render: ({ g, innerWidth, innerHeight, margin, setTooltip }) => {
        if (data.length === 0) return;

        const xScale = scaleBand<string>()
          .domain(data.map((d) => d.category))
          .range([0, innerWidth])
          .padding(0.25);

        const yScale = scaleLinear()
          .domain([0, (max(data, (d) => d.sales) ?? 160) * 1.12])
          .nice()
          .range([innerHeight, 0]);

        renderHorizontalGridlines(g, yScale, innerWidth);
        renderAxes(g, {
          xScale,
          yScale,
          innerHeight,
          yTicks: 5,
          rotateXLabels: true,
        });
        renderAxisLabels(g, innerWidth, innerHeight, {
          yLabel: 'Units Sold',
          yOffset: -38,
        });

        const bars = g
          .selectAll<SVGRectElement, CategorySales>('rect.bar')
          .data(data, (d) => d.category)
          .join('rect')
          .attr('class', 'bar cursor-pointer fill-teal-600 outline-none')
          .attr('x', (d) => xScale(d.category) ?? 0)
          .attr('width', xScale.bandwidth())
          .attr('rx', 4)
          .call(bindTooltipInteractions, {
            ariaLabel: (d) => `${d.category}: ${d.sales} units`,
            tooltip: (d) => ({
              x: margin.left + (xScale(d.category) ?? 0) + xScale.bandwidth() / 2,
              y: margin.top + yScale(d.sales),
              title: d.category,
              lines: [`Sales: ${d.sales} units`],
            }),
            setTooltip,
            onActive: (el) => el.classed('fill-teal-800', true),
            onInactive: (el) => el.classed('fill-teal-800', false),
          });

        if (!hasAnimatedRef.current) {
          bars
            .attr('y', innerHeight)
            .attr('height', 0)
            .transition()
            .duration(650)
            .delay((_, i) => i * 25)
            .attr('y', (d) => yScale(d.sales))
            .attr('height', (d) => innerHeight - yScale(d.sales));
          hasAnimatedRef.current = true;
        } else {
          bars
            .attr('y', (d) => yScale(d.sales))
            .attr('height', (d) => innerHeight - yScale(d.sales));
        }

        g.selectAll<SVGTextElement, CategorySales>('text.value-label')
          .data(data, (d) => d.category)
          .join('text')
          .attr('class', 'value-label pointer-events-none fill-slate-800 text-[11px] font-semibold')
          .attr('x', (d) => (xScale(d.category) ?? 0) + xScale.bandwidth() / 2)
          .attr('y', (d) => yScale(d.sales) - 6)
          .attr('text-anchor', 'middle')
          .text((d) => d.sales);
      },
    },
    [data]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        role="img"
        aria-label="Sales by Product Category Bar Chart"
        className="block w-full"
      />
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}