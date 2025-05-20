'use client';

import cytoscape from '@/lib/cytoscapeWithExtensions';
import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { graphDataAtom } from '@/store/graphAtoms';
import { parseNeo4jInt } from '@/utils/neo4jUtils';

export default function TestPage2() {
    const cyRef = useRef(null);
    const cyInstanceRef = useRef(null);
    const [graphData, setGraphData] = useAtom(graphDataAtom);

    const loadGraph = async (query = null) => {
        const res = await fetch(query ? '/api/query' : '/api/graph', {
            method: query ? 'POST' : 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: query ? JSON.stringify({ query }) : null,
        });
        const { data } = await res.json();
        setGraphData(data);
    };

    useEffect(() => {
        loadGraph(null);
    }, []);

    useEffect(() => {
        if (!cyRef.current) return;
        const cy = cytoscape({
            container: cyRef.current,
            style: [
                {
                    selector: 'node',
                    style: {
                        width: 150,
                        height: 50,
                        backgroundColor: '#90caf9',
                        shape: 'rectangle',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        width: 1,
                        'line-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'target-arrow-color': '#ccc',
                        'curve-style': 'bezier',
                    },
                },
            ],
        });

        cy.add([...graphData.nodes, ...graphData.edges]);

        cy.layout({
            name: 'dagre',
            rankDir: 'RL',
            nodeSep: 40,
            rankSep: 100,
            edgeSep: 20,
            padding: 20,
            animate: true,
        }).run();

        // node-html-label 등록
        cy.nodeHtmlLabel([
            {
                query: 'node',
                halign: 'center',
                valign: 'center',
                tpl: (data) => {
                    const value = parseNeo4jInt(data.amount) || 0;
                    return `
                    <div 
                      class="cy-node-label-html" 
                      style="text-align:center; pointer-events:auto;"
                    >
                      <input 
                        type="range"
                        value="${value}"
                        min="${0}"
                        max="${100000000000}"
                        oninput="console.log(this.value)"
                        onmousedown="event.stopPropagation();"
                        onmousemove="event.stopPropagation();"
                        style="width: 100px; pointer-events: auto;"
                      />
                      <div>${data.name} ${value}</div>
                    </div>
                  `;
                },
            },
        ]);

        cyInstanceRef.current = cy;
    }, [graphData]);

    return (
        <>
            <input
                type="range"
                min={0}
                max={10}
                onInput={(e) => {
                    console.log('Slider changed:', e.currentTarget.value);
                }}
            />
            <div id="cy" ref={cyRef} style={{ width: '1000px', height: '600px', border: '1px solid #eee' }} />
        </>
    );
}
