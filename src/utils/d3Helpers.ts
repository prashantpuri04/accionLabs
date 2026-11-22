import type { Dispatch, SetStateAction } from 'react';
import { axisBottom, axisLeft, type AxisDomain, type AxisScale } from 'd3-axis';
import type { ScaleLinear } from 'd3-scale';
import { select, type BaseType, type Selection } from 'd3-selection';
import type { TooltipState } from '../types/charts';

export function renderHorizontalGridlines(
  g: Selection<SVGGElement, unknown, null, undefined>,
  yScale: ScaleLinear<number, number>,
  innerWidth: number,
  ticks = 5
) {
  g.append('g')
    .attr('class', 'grid')
    .call(axisLeft(yScale).ticks(ticks).tickSize(-innerWidth).tickFormat(() => ''))
    .call((sel) => sel.select('.domain').remove())
    .call((sel) =>
      sel.selectAll('line').attr('stroke', '#e2e8f0').attr('stroke-dasharray', '3,3')
    );
}

export function renderAxes<X extends AxisDomain, Y extends AxisDomain>(
  g: Selection<SVGGElement, unknown, null, undefined>,
  options: {
    xScale: AxisScale<X>;
    yScale: AxisScale<Y>;
    innerHeight: number;
    xTicks?: number;
    yTicks?: number;
    xFormat?: (domainValue: X, index: number) => string;
    yFormat?: (domainValue: Y, index: number) => string;
    rotateXLabels?: boolean;
  }
) {
  const xAxis = axisBottom(options.xScale);
  if (options.xTicks !== undefined) xAxis.ticks(options.xTicks);
  if (options.xFormat) xAxis.tickFormat(options.xFormat);

  const xLabels = g
    .append('g')
    .attr('transform', `translate(0,${options.innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('class', 'fill-slate-600 text-xs');

  if (options.rotateXLabels) {
    xLabels.attr('transform', 'rotate(-35)').style('text-anchor', 'end');
  }

  const yAxis = axisLeft(options.yScale);
  if (options.yTicks !== undefined) yAxis.ticks(options.yTicks);
  if (options.yFormat) yAxis.tickFormat(options.yFormat);

  g.append('g')
    .call(yAxis)
    .selectAll('text')
    .attr('class', 'fill-slate-600 text-xs');
}

export function renderAxisLabels(
  g: Selection<SVGGElement, unknown, null, undefined>,
  innerWidth: number,
  innerHeight: number,
  labels: { xLabel?: string; yLabel?: string; xOffset?: number; yOffset?: number }
) {
  if (labels.xLabel) {
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + (labels.xOffset ?? 38))
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-slate-700 text-xs font-semibold')
      .text(labels.xLabel);
  }

  if (labels.yLabel) {
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', labels.yOffset ?? -42)
      .attr('text-anchor', 'middle')
      .attr('class', 'fill-slate-700 text-xs font-semibold')
      .text(labels.yLabel);
  }
}

export function bindTooltipInteractions<GElement extends BaseType, Datum>(
  selection: Selection<GElement, Datum, SVGGElement, unknown>,
  config: {
    ariaLabel: (d: Datum) => string;
    tooltip: (d: Datum) => TooltipState;
    setTooltip: Dispatch<SetStateAction<TooltipState | null>>;
    onActive?: (el: Selection<GElement, unknown, null, undefined>, d: Datum) => void;
    onInactive?: (el: Selection<GElement, unknown, null, undefined>, d: Datum) => void;
  }
) {
  selection
    .attr('tabindex', 0)
    .attr('role', 'button')
    .attr('aria-label', config.ariaLabel)
    .on('mouseenter focus', function (_event, d) {
      config.onActive?.(select(this), d);
      config.setTooltip(config.tooltip(d));
    })
    .on('mouseleave blur', function (_event, d) {
      config.onInactive?.(select(this), d);
      config.setTooltip(null);
    });
}