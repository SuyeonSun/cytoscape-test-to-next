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
    const sliderValueRef = useRef({});

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

        window.handleInputChange = (nodeId, amount) => {
            const cy = cyInstanceRef.current;
            if (!cy || !nodeId) return;

            // 값 저장
            sliderValueRef.current[nodeId] = Number(amount);

            // 자식 node 비활성화화
            const node = cy.getElementById(nodeId);
            if (!node || node.empty()) return;
            const allChildNodes = node.predecessors('node');
            allChildNodes.forEach((childNode) => {
                const html = document.querySelector(`.cy-node-label-html[data-node-id="${childNode.id()}"]`);
                if (html) {
                    const input = html.querySelector('input');
                    if (input) input.disabled = true;
                }
            });
        };
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
                        height: 65,
                        backgroundColor: '#90caf9',
                        shape: 'rectangle',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        label: (ele) => {
                            return `${ele.data('role') === 'negative' ? '-' : '+'}`;
                        },
                        width: 1,
                        'font-size': '30px',
                        'line-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'target-arrow-color': '#ccc',
                        'curve-style': 'bezier',
                    },
                },
            ],
        });

        cy.add([...graphData.nodes, ...graphData.edges]);

        cy.on('tap', 'node', (evt) => {
            console.log('node 클릭:', evt.target.data());
        });

        cy.on('tap', 'edge', (evt) => {
            console.log('edge 클릭:', evt.target.data());
        });

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
        // this.nextElementSibling.textContent = '${data.name} ' + this.value;"
        cy.nodeHtmlLabel([
            {
                query: 'node',
                halign: 'center',
                valign: 'center',
                tpl: (data) => {
                    const savedAmount = sliderValueRef.current?.[data.id];
                    const initialAmount = parseNeo4jInt(data.amount) || 0;
                    const amountValue = savedAmount === undefined ? initialAmount : savedAmount;

                    return `
                    <div 
                      class="cy-node-label-html" 
                      data-node-id="${data.id}"
                      style="text-align:center; pointer-events:auto;"
                    >
                      <div>${data.name}</div>
                      <input 
                        type="range"
                        value="${amountValue}"
                        min="${0}"
                        max="${100000000000}"
                        oninput="
                        handleInputChange('${data.id}', this.value); 
                        this.nextElementSibling.textContent = this.value;"
                        onmousedown="event.stopPropagation();"
                        onmousemove="event.stopPropagation();"
                        style="width: 100px; pointer-events: auto;"
                      />
                      <div>${amountValue}</div>
                    </div>
                  `;
                },
            },
        ]);

        cyInstanceRef.current = cy;
    }, [graphData]);

    return (
        <>
            {/* <input
                type="range"
                min={0}
                max={10}
                onInput={(e) => {
                    console.log('normal input slider value', e.currentTarget.value);
                }}
            /> */}
            <div
                id="cy"
                ref={cyRef}
                style={{ width: '1000px', height: '600px', border: '1px solid #eee', margin: '20px' }}
            />
        </>
    );
}
