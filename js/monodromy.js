import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const GraphVisualization = ({ graphType, numVertices, numEdgesPerVertex }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const cy = cytoscape({
      container: containerRef.current,
      elements: generateGraphElements(graphType, numVertices, numEdgesPerVertex),
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(id)'
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
      ],
      layout: {
        name: graphType === 'flower' ? 'circle' : 'grid'
      }
    });
  }, [graphType, numVertices, numEdgesPerVertex]);

  const generateGraphElements = (type, vertices, edgesPerVertex) => {
    const elements = [];
    
    // Add vertices
    for (let i = 0; i < vertices; i++) {
      elements.push({ data: { id: `v${i}` } });
    }
    
    // Add edges
    if (type === 'flower') {
      for (let i = 1; i < vertices; i++) {
        for (let j = 0; j < edgesPerVertex; j++) {
          elements.push({ data: { source: 'v0', target: `v${i}`, id: `e${i}-${j}` } });
        }
      }
    } else if (type === 'complete') {
      for (let i = 0; i < vertices; i++) {
        for (let j = i + 1; j < vertices; j++) {
          for (let k = 0; k < edgesPerVertex; k++) {
            elements.push({ data: { source: `v${i}`, target: `v${j}`, id: `e${i}-${j}-${k}` } });
          }
        }
      }
    }
    
    return elements;
  };

  return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />;
};

export default GraphVisualization;