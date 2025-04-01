import * as d3 from 'd3';
import { D3DragEvent } from 'd3';
import { useEffect, useRef } from 'react';

const width = window.innerWidth;
const height = window.innerHeight;

const INIT_RADIUS = 10;
const RADIAL_STRENGTH = 50;
const LINK_LENGTH = 100;
const CHARGE_STRENGTH = -100;

// ---- Type Definitions ---- //
interface GraphNode {
  id: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  // Add any other custom node properties here
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  // Add any custom link properties here
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// ---- Main Component ---- //
export default function ForceGraph() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  console.log("SVG ref", svgRef);
  console.log("SVG ref current", svgRef.current);

  useEffect(() => {
    d3.json<GraphData>('/nodesAndEdges.json').then((graph) => {
      console.log("Loaded graph", graph);
      if (!graph) return;

      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove(); // Clear SVG before rendering

      // ---- Simulation Setup ---- //
      const simulation = d3.forceSimulation<GraphNode>(graph.nodes)
        .force('link', d3.forceLink<GraphNode, GraphLink>(graph.links)
          .id(d => d.id)
          .distance(LINK_LENGTH))
        .force('charge', d3.forceManyBody().strength(CHARGE_STRENGTH))
        // .force('radial', d3.forceRadial(INIT_RADIUS).strength(RADIAL_STRENGTH))
        .force('center', d3.forceCenter(width / 2, height / 2));

      // ---- Links ---- //
      const link = svg.append('g')
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .selectAll('line')
        .data(graph.links)
        .join('line');

      // ---- Nodes ---- //
      const node = svg.append('g')
        .attr('stroke', 'pink')
        .attr('stroke-width', 2)
        .selectAll('circle')
        .data(graph.nodes)
        .join('circle')
        .attr('r', 5)
        .attr('fill', 'dodgerblue')
        .call(applyDrag(simulation));

      // ---- Labels ---- //
      const label = svg.append('g')
        .selectAll('text')
        .data(graph.nodes)
        .join('text')
        .attr('dy', 1.5)
        .attr('text-anchor', 'middle')
        .text(d => d.id);

      // ---- Simulation Tick ---- //
      simulation.on('tick', () => {
        link
          .attr('x1', d => getNode(d.source).x!)
          .attr('y1', d => getNode(d.source).y!)
          .attr('x2', d => getNode(d.target).x!)
          .attr('y2', d => getNode(d.target).y!);

        node
          .attr('cx', d => d.x!)
          .attr('cy', d => d.y!);

        label
          .attr('x', d => d.x!)
          .attr('y', d => d.y!);
      });
    });
  }, []);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ background: "#222", border: "2px dashed limegreen" }}
    />
  );

  
}

// ---- Helpers ---- //

function applyDrag(simulation: d3.Simulation<GraphNode, GraphLink>) {
  function dragStarted(
    event: D3DragEvent<SVGCircleElement, GraphNode, unknown>,
    d: GraphNode
  ) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragging(
    event: D3DragEvent<SVGCircleElement, GraphNode, unknown>,
    d: GraphNode
  ) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragEnded(
    event: D3DragEvent<SVGCircleElement, GraphNode, unknown>,
    d: GraphNode
  ) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }


  return d3.drag<SVGCircleElement, GraphNode>()
    .on('start', dragStarted)
    .on('drag', dragging)
    .on('end', dragEnded);
}

// Utility to resolve node objects
function getNode(node: string | GraphNode): GraphNode {
  return typeof node === 'string' ? { id: node } : node;
}
