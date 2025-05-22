'use client';

import cytoscape from '@/lib/cytoscapeWithExtensions';
import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { graphDataAtom } from '@/store/graphAtoms';
import { parseNeo4jInt } from '@/utils/neo4jUtils';

const LAYOUT_MODES = Object.freeze({
    RADIAL: 0,
    DAGRE: 1,
    MINDMAP: 2,
});

const showNode = (node, layoutMode, duration = 800) => {
    node.show();
    node.data('isHidden', false);
    if (layoutMode === LAYOUT_MODES.MINDMAP) {
        requestAnimationFrame(() => {
            node.animate({ style: { opacity: 1 }, duration });
        });
    } else {
        node.style('opacity', 1);
    }
};

const hideNode = (node, layoutMode) => {
    node.hide();
    if (layoutMode === LAYOUT_MODES.MINDMAP) {
        node.style('opacity', 0);
    }
    node.data('isHidden', true);
};

const showEdge = (edge, layoutMode, duration = 800) => {
    if (edge.data('isHidden')) {
        edge.show();
        edge.data('isHidden', false);

        if (layoutMode === LAYOUT_MODES.MINDMAP) {
            requestAnimationFrame(() => {
                edge.animate({ style: { opacity: 1 }, duration });
            });
        } else {
            edge.style('opacity', 1);
        }
    }
};

const hideEdge = (edge, layoutMode) => {
    edge.hide();
    if (layoutMode === LAYOUT_MODES.MINDMAP) {
        edge.style('opacity', 0);
    }
    edge.data('isHidden', true);
};

export default function TestPage2() {
    const cyRef = useRef(null);
    const cyInstanceRef = useRef(null);
    const [graphData, setGraphData] = useAtom(graphDataAtom);
    const nodeRef = useRef({});

    const loadGraph = async (query = null) => {
        const res = await fetch(query ? '/api/query' : '/api/graph', {
            method: query ? 'POST' : 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: query ? JSON.stringify({ query }) : null,
        });
        const { data } = await res.json();
        setGraphData(data);
    };

    const expandNode = (nodeId) => {
        const cy = cyInstanceRef.current;
        if (!cy || !nodeId) return;

        const node = cy.getElementById(nodeId);
        const visited = new Set();
        const queue = [{ node: node, from: null }];
        const rootId = node.id();

        while (queue.length > 0) {
            const { node, from } = queue.shift();
            const nodeId = node.id();
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            const edges = node.connectedEdges();
            edges.forEach((edge) => {
                const source = edge.source();
                const target = edge.target();
                const isOutgoing = source.id() === nodeId;

                if (isOutgoing) {
                    const next = target;
                    const isRootNode = nodeId === rootId;
                    if (!isRootNode) return;

                    showEdge(edge, 2);
                    showNode(next, 2);
                    const nextId = next.id();
                    if (!nodeRef.current[nextId]) nodeRef.current[nextId] = {};
                    nodeRef.current[nextId].isDisplay = true;

                    queue.push({ node: next, from: nodeId });
                } else {
                    const prev = source;
                    const isRootTarget = target.id() === rootId;
                    if (!isRootTarget && prev.data('isHidden')) return;

                    showEdge(edge, 2);
                    showNode(prev, 2);
                    const prevId = prev.id();
                    if (!nodeRef.current[prevId]) nodeRef.current[prevId] = {};
                    nodeRef.current[prevId].isDisplay = true;

                    queue.push({ node: prev, from: nodeId });
                }
            });
        }
    };

    const collapseNode = (nodeId) => {
        const cy = cyInstanceRef.current;
        if (!cy || !nodeId) return;

        const node = cy.getElementById(nodeId);
        const visited = new Set();
        const queue = [node];

        while (queue.length > 0) {
            const node = queue.shift();
            const nodeId = node.id();
            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            // const incomingEdges = node.connectedEdges().filter((edge) => edge.target().id() === nodeId);
            const incomers = node.incomers('edge');

            incomers.forEach((edge) => {
                // incomingEdges.forEach((edge) => {
                const source = edge.source();

                hideEdge(edge, 2);
                hideNode(source, 2);
                if (!nodeRef.current[source.id()]) nodeRef.current[source.id()] = {};
                nodeRef.current[source.id()].isDisplay = false;
                nodeRef.current[source.id()].expanded = false;

                queue.push(source);
            });
        }
    };

    const forceReRenderNode = (nodeId) => {
        const cy = cyInstanceRef.current;
        const node = cy.getElementById(nodeId);
        node.addClass('force-re-render');
        node.removeClass('force-re-render');
    };

    useEffect(() => {
        loadGraph(null);

        window.handleToggleClick = (nodeId) => {
            const cy = cyInstanceRef.current;
            const ref = nodeRef.current[nodeId];
            if (!ref) return;

            if (ref.expanded) {
                collapseNode(nodeId);
            } else {
                expandNode(nodeId);
                cy.animate({
                    panBy: { x: -50, y: 0 },
                    duration: 400,
                    easing: 'ease-in-out',
                }); // cy.panBy({ x: -50, y: 0 });
            }
            ref.expanded = !ref.expanded;

            forceReRenderNode(nodeId);
        };

        window.showInput = (nodeId) => {
            const html = document.querySelector(`.cy-node-label-html[data-node-id="${nodeId}"]`);
            if (html) {
                const input = html.querySelector('.range-input');
                if (input) input.style.display = 'inline-block';
            }
        };

        window.hideInput = (nodeId) => {
            const html = document.querySelector(`.cy-node-label-html[data-node-id="${nodeId}"]`);
            if (html) {
                const input = html.querySelector('.range-input');
                if (input) input.style.display = 'none';
            }
        };

        window.handleInputChange = (nodeId, initialAmount, amountValue, percentageValue) => {
            const cy = cyInstanceRef.current;
            if (!cy || !nodeId) return;

            if (!nodeRef.current[nodeId]) {
                nodeRef.current[nodeId] = {};
            }
            // 값 저장
            const calculatedAmount = initialAmount * (1 + Number(percentageValue) / 100);
            nodeRef.current[nodeId].amount = calculatedAmount;
            nodeRef.current[nodeId].percentage = Number(percentageValue);

            // 자식 node 비활성화
            const node = cy.getElementById(nodeId);
            if (!node || node.empty()) return;
            const allChildNodes = node.predecessors('node');
            allChildNodes.forEach((childNode) => {
                const childId = childNode.id();
                if (!nodeRef.current[childId]) {
                    nodeRef.current[childId] = {};
                }
                nodeRef.current[childId].disabled = true;
                const html = document.querySelector(`.cy-node-label-html[data-node-id="${childId}"]`);
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
                        width: 190,
                        height: 60,
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
                        'curve-style': 'round-taxi',
                        'taxi-direction': 'leftward',
                        'taxi-turn': 20,
                        'taxi-turn-min-distance': 10,
                    },
                },
            ],
        });

        cy.add([...graphData.nodes, ...graphData.edges]);

        // cy.on('tap', 'node', (evt) => {
        //     console.log('node 클릭:', evt.target.data());
        // });

        // cy.on('tap', 'edge', (evt) => {
        //     console.log('edge 클릭:', evt.target.data());
        // });

        const layout = cy
            .layout({
                name: 'dagre',
                rankDir: 'RL',
                nodeSep: 25,
                rankSep: 80,
                edgeSep: 60,
                padding: 20,
                animate: true,
            })
            .run();

        // this.nextElementSibling.textContent = '${data.name} ' + this.value;"
        cy.nodeHtmlLabel([
            {
                query: 'node',
                halign: 'center',
                valign: 'center',
                tpl: (data) => {
                    const ref = nodeRef.current?.[data.id] || {};

                    if (ref.isDisplay === false) return '';

                    const initialAmount = parseNeo4jInt(data.amount);
                    if (ref.initialAmount === undefined) {
                        ref.initialAmount = initialAmount;
                    }

                    const calculatedAmount = ref.amount;
                    const amountValue = calculatedAmount === undefined ? initialAmount : calculatedAmount;
                    const percentageValue = ref.percentage === undefined ? 0 : ref.percentage;
                    const disabled = ref.disabled ? 'disabled' : '';

                    const expanded = ref.expanded === true;
                    const toggleSymbol = expanded ? '&lt;' : '&gt;';

                    const node = cy.getElementById(data.id);
                    const allChildNodes = node.predecessors('node');
                    const isLeaf = allChildNodes.length === 0 ? true : false;

                    const excludedNames = ['액티비티수차합', '액티비티단가합', '생산입고', '공정출고', '비용계획합'];

                    return `
                    <div 
                      class="cy-node-label-html" 
                      data-node-id="${data.id}"
                      onmouseover="showInput('${data.id}');"
                      onmouseout="hideInput('${data.id}');"
                      style="
                      text-align:center; 
                      pointer-events:auto; 
                      background: white;
                      border: 2px solid #90caf9;
                      border-radius: 10px;
                      box-shadow: 0 1px 5px rgba(0,0,0,0.1);
                      padding: 10px;
                      width: 200px;
                      position: relative;
                      "
                    >  
                        ${
                            isLeaf
                                ? ''
                                : `<div
                                    style="
                            position: absolute;
                            right: -13px;
                            top: 50%;
                            transform: translateY(-50%);
                            background: white;
                            border: 1px solid #90caf9;
                            border-radius: 50%;
                            width: 20px;
                            height: 20px;
                            font-weight: bold;
                            font-size: 14px;
                            text-align: center;
                            line-height: 20px;
                            box-shadow: 0 1px 4px rgba(0,0,0,0.15);
                            pointer-events: auto;
                            cursor: pointer;
                            "
                                    onclick="handleToggleClick('${data.id}')"
                                >
                                    ${toggleSymbol}
                                </div>`
                        } 
                        
                        <div>${data.name}</div>
                        
                        ${
                            excludedNames.includes(data.name)
                                ? ''
                                : `<input 
                            class="range-input"
                            type="range"
                            ${disabled}
                            value="${percentageValue}"
                            min="${-100}"
                            max="${100}"
                            oninput="
                                handleInputChange('${data.id}', ${initialAmount}, ${amountValue}, this.value);
                                const percentageDiv = this.closest('.cy-node-label-html')?.querySelector('.percentage');
                                if (percentageDiv) percentageDiv.textContent = this.value;
                            "
                            onmousedown="event.stopPropagation();"
                            onmousemove="event.stopPropagation();"
                            style="width: 100px; pointer-events: auto; display: none"
                        />`
                        }
                        <div class="percentage">${percentageValue}%</div>
                        <div>${percentageValue}</div>
                        <div>${amountValue}</div>
                    </div>
                  `;
                },
            },
        ]);

        cy.nodes().forEach((node) => {
            const nodeId = node.id();
            if (!nodeRef.current[nodeId]) nodeRef.current[nodeId] = {};
            nodeRef.current[nodeId].isDisplay = false;

            hideNode(node, 2);
        });

        cy.edges().forEach((edge) => {
            hideEdge(edge, 2);
        });

        const roots = cy.nodes().filter((node) => node.outgoers('edge').length === 0);

        layout.on('layoutstop', () => {
            roots.forEach((root) => {
                // root.show();
                // root.data('isHidden', false);
                // root.animate({ style: { opacity: 1 }, duration: 5 });
                showNode(root, 2);
                const rootId = root.id();
                nodeRef.current[rootId].isDisplay = true;
                nodeRef.current[rootId].expanded = false;
            });

            cy.zoom({
                level: 0.6,
            });

            cy.center(roots);
        });

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
                style={{
                    width: '1000px',
                    height: '600px',
                    border: '1px solid #eee',
                    margin: '20px',
                }}
            />
        </>
    );
}
