'use client';

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

/**
 * Network Graph Component
 * 
 * Renders an interactive network visualization using Cytoscape.js.
 * Displays nodes (users) and edges (relationships) from the Neo4j database.
 */

interface Node {
  id: string;
  label: string;
  type: string;
  size?: number;
}

interface Edge {
  source: string;
  target: string;
  type: string;
}

interface NetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string, nodeType: string) => void;
}

export function NetworkGraph({ nodes, edges, onNodeClick }: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const layoutRef = useRef<any>(null);
  const isDestroyedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return;

    // Reset destroyed flag
    isDestroyedRef.current = false;

    // Clean up previous instance if it exists
    if (cyRef.current) {
      try {
        cyRef.current.destroy();
      } catch (e) {
        // Ignore
      }
      cyRef.current = null;
    }

    // Clear the container
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: {
        nodes: nodes.map((node) => ({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            size: node.size || 10,
          },
        })),
        edges: edges.map((edge, index) => ({
          data: {
            id: `edge-${index}`,
            source: edge.source,
            target: edge.target,
            type: edge.type,
          },
        })),
      },
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#4f46e5',
            'label': 'data(label)',
            'width': 'data(size)',
            'height': 'data(size)',
            'font-size': '8px',
            'text-valign': 'center',
            'text-halign': 'center',
            'color': '#1f2937',
            'text-background-color': '#ffffff',
            'text-background-opacity': 0.8,
            'text-background-padding': '2px',
            'border-width': 2,
            'border-color': '#e5e7eb',
          },
        },
        {
          selector: 'node[type="user"]',
          style: {
            'background-color': '#3b82f6',
            'border-color': '#2563eb',
          },
        },
        {
          selector: 'node[type="User"]',
          style: {
            'background-color': '#3b82f6',
            'border-color': '#2563eb',
          },
        },
        {
          selector: 'node[type="Tweet"]',
          style: {
            'background-color': '#10b981',
            'shape': 'rectangle',
            'border-color': '#059669',
          },
        },
        {
          selector: 'node[type="Hashtag"]',
          style: {
            'background-color': '#f59e0b',
            'shape': 'diamond',
            'border-color': '#d97706',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#9ca3af',
            'target-arrow-color': '#9ca3af',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
          },
        },
        {
          selector: 'edge[type="FOLLOWS"]',
          style: {
            'line-color': '#3b82f6',
            'target-arrow-color': '#3b82f6',
          },
        },
        {
          selector: 'edge[type="POSTS"]',
          style: {
            'line-color': '#10b981',
            'target-arrow-color': '#10b981',
          },
        },
        {
          selector: 'edge[type="TAGS"]',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
          },
        },
      ],
      minZoom: 0.5,
      maxZoom: 3,
    });

    // Define event handlers with destroyed check
    const handleMouseOver = (event: any) => {
      if (!isDestroyedRef.current && cyRef.current) {
        try {
          event.target.style('background-color', '#6366f1');
          document.body.style.cursor = 'pointer';
        } catch (e) {
          // Ignore errors
        }
      }
    };

    const handleMouseOut = (event: any) => {
      if (!isDestroyedRef.current && cyRef.current) {
        try {
          const type = event.target.data('type');
          const color = type === 'User' || type === 'user' ? '#3b82f6' : type === 'Tweet' ? '#10b981' : '#f59e0b';
          event.target.style('background-color', color);
          document.body.style.cursor = 'default';
        } catch (e) {
          // Ignore errors
        }
      }
    };

    const handleTap = (event: any) => {
      if (!isDestroyedRef.current && cyRef.current) {
        try {
          const nodeId = event.target.data('id');
          const nodeType = event.target.data('type');
          if (onNodeClick && nodeId && nodeType) {
            onNodeClick(nodeId, nodeType);
          }
        } catch (e) {
          // Ignore errors
        }
      }
    };

    // Add event listeners
    cy.on('mouseover', 'node', handleMouseOver);
    cy.on('mouseout', 'node', handleMouseOut);
    cy.on('tap', 'node', handleTap);

    cyRef.current = cy;

    // Run layout and store reference
    const layout = cy.layout({
      name: 'cose',
      idealEdgeLength: 100,
      nodeOverlap: 20,
      refresh: 20,
      fit: true,
      padding: 30,
      randomize: false,
      componentSpacing: 100,
      nodeRepulsion: 400000,
      edgeElasticity: 100,
      nestingFactor: 5,
      gravity: 80,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0,
      animate: false, // Disable animation to prevent async issues
    });
    
    layoutRef.current = layout;
    layout.run();

    return () => {
      // Mark as destroyed FIRST to stop all event handlers
      isDestroyedRef.current = true;
      
      // Reset cursor
      document.body.style.cursor = 'default';
      
      // Stop layout IMMEDIATELY
      if (layoutRef.current) {
        try {
          layoutRef.current.stop();
          layoutRef.current = null;
        } catch (e) {
          // Ignore
        }
      }
      
      // Clean up Cytoscape instance
      if (cyRef.current) {
        try {
          // Remove all event listeners before destroying
          cyRef.current.removeAllListeners();
          
          // Destroy immediately (no setTimeout)
          cyRef.current.destroy();
          cyRef.current = null;
        } catch (error) {
          // Silently ignore errors during cleanup
          cyRef.current = null;
        }
      }

      // Clear the container HTML
      if (containerRef.current) {
        try {
          containerRef.current.innerHTML = '';
        } catch (e) {
          // Ignore
        }
      }
    };
  }, [nodes, edges, onNodeClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] border rounded-lg bg-white"
      style={{ backgroundColor: '#ffffff' }}
    />
  );
}

