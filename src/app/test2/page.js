'use client';

import cytoscape from '@/lib/cytoscapeWithExtensions';
import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { graphDataAtom } from '@/store/graphAtoms';

export default function TestPage2() {
    const cyRef = useRef(null);
    const cyInstanceRef = useRef(null);
    const [graphData, setGraphData] = useAtom(graphDataAtom);

    // window 전역 함수 등록 (입력창 blur 시 반영)
    useEffect(() => {
        window.updateNodeName = (nodeId, value) => {
            const cy = cyInstanceRef.current;
            const node = cy?.getElementById(nodeId);
            if (node) {
                node.data('name', value);
                cy.style().update();
            }
        };
    }, []);

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
                        width: 80,
                        height: 40,
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

        // node-html-label 등록
        cy.nodeHtmlLabel([
            {
                query: 'node',
                halign: 'center',
                valign: 'center',
                tpl: (data) => `
                  <div class="cy-node-label-html" 
                      style="text-align:center; pointer-events:auto;"
                      onclick="event.stopPropagation();"
                      onmousedown="event.stopPropagation();"
                      onmouseup="event.stopPropagation();"
                  >
                    <input type="text"
                      value="${data.amount || 0}"
                      oninput="this.setAttribute('value', this.value)"
                      onblur="window.updateNodeName('${data.id}', this.value)"
                      style="
                        width: 60px;
                        font-size: 10px;
                        padding: 2px;
                        border-radius: 4px;
                        border: 1px solid #ccc;
                        pointer-events: auto;
                      "
                      onclick="event.stopPropagation();"
                      onmousedown="event.stopPropagation();"
                      onmouseup="event.stopPropagation();"
                    />
                  </div>
                `,
            },
        ]);

        cyInstanceRef.current = cy;
    }, [graphData]);

    return (
        <>
            <p>Test Page2</p>
            <div id="cy" ref={cyRef} style={{ width: '600px', height: '600px', border: '1px solid #eee' }} />
        </>
    );
}
