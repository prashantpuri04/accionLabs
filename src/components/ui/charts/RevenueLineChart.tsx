import { useMemo } from 'react';
import { extent, max } from 'd3-array';
import { scaleLinear, scaleTime } from 'd3-scale';
import { curveMonotoneX, line } from 'd3-shape';
import { timeFormat, timeParse } from 'd3-time-format';
import { useD3Chart } from '../../../hooks/useD3Chart';
import type { Margin, RevenuePoint } from '../../../types/charts';
import {
  bindTooltipInteractions,
  renderAxes,
  renderAxisLabels,
  renderHorizontalGridlines,
} from '../../../utils/d3Helpers';
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
  const parsed = useMemo(() => {
    const parseDate = timeParse('%Y-%m-%d');
    return data
      .map((d) => ({ date: parseDate(d.date), rawDate: d.date, revenue: d.revenue }))
      .filter((d): d is ParsedPoint => d.date !== null);
  }, [data]);

  const { containerRef, svgRef, tooltip } = useD3Chart(
    {
      height: 320,
      margin: MARGIN,
      render: ({ g, width, innerWidth, innerHeight, margin, setTooltip }) => {
        if (parsed.length === 0) return;

        const [minDate, maxDate] = extent(parsed, (d) => d.date);
        if (!minDate || !maxDate) return;

        const formatMonth = timeFormat('%b %Y');
        const formatShortMonth = timeFormat('%b');

        const xScale = scaleTime().domain([minDate, maxDate]).range([0, innerWidth]);
        const yScale = scaleLinear()
          .domain([0, (max(parsed, (d) => d.revenue) ?? 100) * 1.1])
          .nice()
          .range([innerHeight, 0]);

        renderHorizontalGridlines(g, yScale, innerWidth);
        renderAxes(g, {
          xScale,
          yScale,
          innerHeight,
          xTicks: width < 500 ? 4 : 6,
          yTicks: 5,
          xFormat: (d) => formatShortMonth(d),
          yFormat: (d) => `$${d}k`,
        });
        renderAxisLabels(g, innerWidth, innerHeight, {
          yLabel: 'Revenue (USD Thousands)',
        });

        const lineGen = line<ParsedPoint>()
          .x((d) => xScale(d.date))
          .y((d) => yScale(d.revenue))
          .curve(curveMonotoneX);

        g.append('path')
          .datum(parsed)
          .attr('class', 'fill-none stroke-blue-600 stroke-[2.5]')
          .attr('d', lineGen);

        g.selectAll<SVGCircleElement, ParsedPoint>('circle.point')
          .data(parsed, (d) => d.rawDate)
          .join('circle')
          .attr('class', 'point cursor-pointer fill-blue-600 stroke-white stroke-2 outline-none')
          .attr('cx', (d) => xScale(d.date))
          .attr('cy', (d) => yScale(d.revenue))
          .attr('r', 5)
          .call(bindTooltipInteractions, {
            ariaLabel: (d) => `${formatMonth(d.date)}: $${d.revenue}k`,
            tooltip: (d) => ({
              x: margin.left + xScale(d.date),
              y: margin.top + yScale(d.revenue),
              title: formatMonth(d.date),
              lines: [`Revenue: $${d.revenue}k`],
            }),
            setTooltip,
            onActive: (el) => el.attr('r', 7).classed('fill-blue-800', true),
            onInactive: (el) => el.attr('r', 5).classed('fill-blue-800', false),
          });
      },
    },
    [parsed]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        role="img"
        aria-label="Monthly Revenue Time-Series Line Chart"
        className="block w-full"
      />
      <ChartTooltip tooltip={tooltip} />
    </div>
  );
}