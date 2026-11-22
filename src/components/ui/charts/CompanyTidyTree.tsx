import { useCallback, useMemo, useState } from 'react';
import { hierarchy, tree, type HierarchyPointLink, type HierarchyPointNode } from 'd3-hierarchy';
import { linkHorizontal } from 'd3-shape';
import { useD3Chart } from '../../../hooks/useD3Chart';
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
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

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

  const toggleNode = useCallback(
    (name: string) => {
      if (!nodesWithChildren.has(name)) return;
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return next;
      });
    },
    [nodesWithChildren]
  );

  const { containerRef, svgRef } = useD3Chart(
    {
      height: 340,
      margin: MARGIN,
      render: ({ g, innerWidth, innerHeight }) => {
        const visibleTreeData = pruneCollapsed(data, collapsed);
        const root = hierarchy<OrgNode>(visibleTreeData);
        const treeRoot = tree<OrgNode>().size([innerHeight, innerWidth])(root);

        const linkGen = linkHorizontal<HierarchyPointLink<OrgNode>, HierarchyPointNode<OrgNode>>()
          .x((d) => d.y)
          .y((d) => d.x);

        g.selectAll<SVGPathElement, HierarchyPointLink<OrgNode>>('path.link')
          .data(treeRoot.links())
          .join('path')
          .attr('class', 'link fill-none stroke-slate-300 stroke-2')
          .attr('d', linkGen);

        const nodes = g
          .selectAll<SVGGElement, HierarchyPointNode<OrgNode>>('g.node')
          .data(treeRoot.descendants(), (d) => d.data.name)
          .join('g')
          .attr('class', (d) =>
            nodesWithChildren.has(d.data.name)
              ? 'node cursor-pointer outline-none'
              : 'node outline-none'
          )
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
          .attr('class', 'stroke-white stroke-2')
          .attr('fill', (d) => {
            if (!nodesWithChildren.has(d.data.name)) return '#64748b';
            return collapsed.has(d.data.name) ? '#f59e0b' : '#2563eb';
          });

        nodes
          .append('text')
          .attr('dy', '0.32em')
          .attr('x', (d) => (d.children ? -12 : 12))
          .attr('text-anchor', (d) => (d.children ? 'end' : 'start'))
          .attr('class', (d) =>
            nodesWithChildren.has(d.data.name)
              ? 'fill-slate-800 text-xs font-semibold'
              : 'fill-slate-700 text-xs'
          )
          .text((d) => (collapsed.has(d.data.name) ? `${d.data.name} (+)` : d.data.name));
      },
    },
    [data, collapsed, nodesWithChildren, toggleNode]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        ref={svgRef}
        role="img"
        aria-label="Company Organization Tidy Tree"
        className="block w-full"
      />
    </div>
  );
}