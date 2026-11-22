import { useEffect, useMemo, useRef, useState } from 'react';
import { hierarchy, tree, type HierarchyPointLink, type HierarchyPointNode } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { linkHorizontal } from 'd3-shape';
import { useResizeObserver } from '../../../hooks/useResizeObserver';
import type { Margin, OrgNode } from '../../../types/charts';

interface Props {
  data: OrgNode;
}

const MARGIN: Margin = { top: 24, right: 110, bottom: 24, left: 90 };

function pruneCollapsed(node: OrgNode, collapsed: Set<string>): OrgNode {
  if (!node.children || collapsed.has(node.name)) {
    return { name: node.name };
  }
  return {
    name: node.name,
    children: node.children.map((child) => pruneCollapsed(child, collapsed)),
  };
}

export function CompanyTidyTree({ data }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width } = useResizeObserver(containerRef);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  // Track which nodes originally had children so collapsed nodes still show an expand indicator
  const nodesWithChildren = useMemo(() => {
    const set = new Set<string>();
    const walk = (n: OrgNode) => {
      if (n.children && n.children.length > 0) {
        set.add(n.name);
        n.children.forEach(walk);
      }
    };
    walk(data);
    return set;
  }, [data]);

  const toggleNode = (name: string) => {
    if (!nodesWithChildren.has(name)) return;
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || width === 0) return;

    const height = 340;
    const innerWidth = Math.max(120, width - MARGIN.left - MARGIN.right);
    const innerHeight = Math.max(120, height - MARGIN.top - MARGIN.bottom);

    const visibleTreeData = pruneCollapsed(data, collapsed);
    const root = hierarchy<OrgNode>(visibleTreeData);
    const treeLayout = tree<OrgNode>().size([innerHeight, innerWidth]);
    const treeRoot = treeLayout(root);

    const svg = select(svgEl);
    svg.selectAll('*').remove();

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const linkGen = linkHorizontal<HierarchyPointLink<OrgNode>, HierarchyPointNode<OrgNode>>()
      .x((d) => d.y)
      .y((d) => d.x);

    // Horizontal Links (REQ-TREE-02)
    g.selectAll<SVGPathElement, HierarchyPointLink<OrgNode>>('path.link')
      .data(treeRoot.links())
      .join('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('d', linkGen);

    // Nodes (REQ-TREE-03)
    const nodes = g
      .selectAll<SVGGElement, HierarchyPointNode<OrgNode>>('g.node')
      .data(treeRoot.descendants(), (d) => d.data.name)
      .join('g')
      .attr('class', (d) => (nodesWithChildren.has(d.data.name) ? 'node cursor-pointer outline-none' : 'node outline-none'))
      .attr('transform', (d) => `translate(${d.y},${d.x})`)
      .attr('tabindex', (d) => (nodesWithChildren.has(d.data.name) ? 0 : -1))
      .attr('role', (d) => (nodesWithChildren.has(d.data.name) ? 'button' : null))
      .attr('aria-expanded', (d) =>
        nodesWithChildren.has(d.data.name) ? !collapsed.has(d.data.name) : null
      )
      .on('click', (_event, d) => toggleNode(d.data.name))
      .on('keydown', (event: KeyboardEvent, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleNode(d.data.name);
        }
      });

    nodes
      .append('circle')
      .attr('r', 7)
      .attr('fill', (d) => {
        if (!nodesWithChildren.has(d.data.name)) return '#64748b';
        return collapsed.has(d.data.name) ? '#f59e0b' : '#2563eb';
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    nodes
      .append('text')
      .attr('dy', '0.32em')
      .attr('x', (d) => (d.children ? -12 : 12))
      .attr('text-anchor', (d) => (d.children ? 'end' : 'start'))
      .attr('fill', '#1e293b')
      .attr('font-size', '12px')
      .attr('font-weight', (d) => (nodesWithChildren.has(d.data.name) ? '600' : '400'))
      .text((d) => {
        const isCollapsed = collapsed.has(d.data.name);
        return isCollapsed ? `${d.data.name} (+)` : d.data.name;
      });

    return () => {
      svg.selectAll('*').interrupt();
    };
  }, [data, width, collapsed, nodesWithChildren]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} role="img" aria-label="Company Organization Tidy Tree" className="block w-full" />
    </div>
  );
}