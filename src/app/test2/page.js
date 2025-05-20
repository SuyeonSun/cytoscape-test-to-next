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

    // window 전역 함수 등록 (입력창 blur 시 반영)
    useEffect(() => {
        window.freezeCyInteractions = () => {
            const cy = cyInstanceRef.current;
            cy?.autoungrabify(true); // 전체 노드 클릭/드래그 방지
        };

        window.restoreCyInteractions = () => {
            const cy = cyInstanceRef.current;
            cy?.autoungrabify(false); // 다시 활성화
        };

        window.updateNodeValue = (id, value) => {
            const cy = cyInstanceRef.current;
            const node = cy?.getElementById(id);
            if (node) node.data('amount', Number(value));
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
                        onmousedown="event.stopPropagation();"
                        onmousemove="event.stopPropagation();"
                        style="width: 100px; pointer-events: auto;"
                      />
                    </div>
                  `;
                },
            },
        ]);

        cyInstanceRef.current = cy;
    }, [graphData]);

    return (
        <>
            <p>Test Page2</p>
            <input
                type="range"
                onInput={(e) => {
                    console.log('Slider changed:', e.currentTarget.value);
                }}
            />
            <div id="cy" ref={cyRef} style={{ width: '600px', height: '600px', border: '1px solid #eee' }} />
        </>
    );
}
