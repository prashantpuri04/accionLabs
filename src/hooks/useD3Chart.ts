import { useEffect, useRef, useState, type DependencyList, type Dispatch, type SetStateAction } from 'react';
import { select, type Selection } from 'd3-selection';
import type { Margin, TooltipState } from '../types/charts';
import { useResizeObserver } from './useResizeObserver';

export interface D3RenderContext {
  svg: Selection<SVGSVGElement, unknown, null, undefined>;
  g: Selection<SVGGElement, unknown, null, undefined>;
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: Margin;
  setTooltip: Dispatch<SetStateAction<TooltipState | null>>;
}

interface UseD3ChartOptions {
  height: number;
  margin: Margin;
  render: (ctx: D3RenderContext) => void;
}

export function useD3Chart(
  { height, margin, render }: UseD3ChartOptions,
  deps: DependencyList
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width } = useResizeObserver(containerRef);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || width === 0) return;

    const innerWidth = Math.max(0, width - margin.left - margin.right);
    const innerHeight = Math.max(0, height - margin.top - margin.bottom);

    const svg = select(svgEl);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    render({
      svg,
      g,
      width,
      height,
      innerWidth,
      innerHeight,
      margin,
      setTooltip,
    });

    return () => {
      svg.selectAll('*').interrupt();
      setTooltip(null);
    };
  }, [width, height, margin, ...deps]);

  return { containerRef, svgRef, tooltip, width };
}