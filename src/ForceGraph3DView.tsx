import { useEffect, useRef, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import * as d3 from 'd3-force-3d';
import './styles.css';

// ---- Type Definitions ---- //
interface GraphNode {
  id: string;
  x?: number;
  y?: number;
  z?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function ForceGraph3DView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    fetch('/nodesAndEdges.json')
      .then(res => res.json())
      .then((graph: GraphData) => {
        setLoading(false)
        const Graph = new ForceGraph3D(containerRef.current!) // ✅ No `new`
            .graphData(graph)
            .nodeAutoColorBy('label')
            .nodeLabel('id')
            .backgroundColor('#000')
            .nodeThreeObject((node: GraphNode) => {
                const sprite = new THREE.Sprite(
                new THREE.SpriteMaterial({ color: 'cyan' })
                );
                sprite.scale.set(5, 5, 1);
                return sprite;
            })
            .linkDirectionalParticles(1)
            .linkDirectionalParticleSpeed(0.04)
            .linkDirectionalParticleWidth(2)
            .linkDirectionalParticleColor(() => 'lime');

            Graph.d3Force('radial', d3.forceRadial(500, 0, 0, 0).strength(0.5));
            Graph.d3Force('charge', d3.forceManyBody().strength(-400));


        // 🌐 Create custom particle spheres
        const particleObjs: { mesh: THREE.Mesh; link: GraphLink; t: number }[] = [];

        graph.links.forEach(link => {
          const geometry = new THREE.SphereGeometry(0.5, 8, 8);
          const material = new THREE.MeshStandardMaterial({
            color: 'hotpink',
            emissive: 'magenta',
            metalness: 0.8,
            roughness: 0.3
          });

          const sphere = new THREE.Mesh(geometry, material);
          Graph.scene().add(sphere);

          particleObjs.push({
            mesh: sphere,
            link,
            t: Math.random() // start at random position along the link
          });
        });

        Graph.d3Force('radial', d3.forceRadial(500, 0, 0, 0).strength(0.5));
        Graph.d3Force('charge', d3.forceManyBody().strength(-400));
        // Graph.d3VelocityDecay(0.99);
        Graph
            .linkDirectionalParticles(1)               // Number of particles per link
            .linkDirectionalParticleSpeed(0.04)        // Speed (0.005–0.03 looks good)
            .linkDirectionalParticleWidth(2)           // Thicker = more visible
            .linkDirectionalParticleColor(() => 'lime'); // Or based on link data



        // 🔁 Animate particles on each frame
        Graph.onRenderFrame(() => {
          particleObjs.forEach(p => {
            const { mesh, link } = p;
            p.t += 0.01;
            if (p.t > 1) p.t = 0;

            const src = typeof link.source === 'object' ? link.source : { x: 0, y: 0, z: 0 };
            const tgt = typeof link.target === 'object' ? link.target : { x: 0, y: 0, z: 0 };

            if (src.x == null || tgt.x == null) return;

            mesh.position.x = src.x + (tgt.x - src.x) * p.t;
            mesh.position.y = src.y + (tgt.y - src.y) * p.t;
            mesh.position.z = src.z + (tgt.z - src.z) * p.t;
          });


          return false; // tell the engine we didn’t modify scene structure
        });
      });
  }, []);

  return (
    <div className="background-wrapper">
      <div className="graph-container" ref={containerRef}></div>
    </div>
  );
}