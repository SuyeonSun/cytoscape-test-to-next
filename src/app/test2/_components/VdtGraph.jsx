'use client';

import cytoscape from '@/lib/cytoscapeWithExtensions';
import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { graphDataAtom, metricMapAtom } from '@/store/graphAtoms';
import { parseNeo4jInt } from '@/utils/neo4jUtils';
import { getMetricKey, updateMetricDataHelper, useUpdateMetricData } from '@/helpers/metricHelper';

const LAYOUT_MODES = Object.freeze({
    RADIAL: 0,
    DAGRE: 1,
    MINDMAP: 2,
});

// Graph1, Graph2 동일 로직 사용
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

// Graph1, Graph2 동일 로직 사용
const hideNode = (node, layoutMode) => {
    node.hide();
    if (layoutMode === LAYOUT_MODES.MINDMAP) {
        node.style('opacity', 0);
    }
    node.data('isHidden', true);
};

// Graph1, Graph2 동일 로직 사용
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

// Graph1, Graph2 동일 로직 사용
const hideEdge = (edge, layoutMode) => {
    edge.hide();
    if (layoutMode === LAYOUT_MODES.MINDMAP) {
        edge.style('opacity', 0);
    }
    edge.data('isHidden', true);
};

export default function VdtGraph() {
    const cyRef = useRef(null);
    const cyInstanceRef = useRef(null);
    const [graphData, setGraphData] = useAtom(graphDataAtom);
    const [, setMetricData] = useAtom(metricMapAtom);
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

    // Graph2에서만 사용 가능
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

    // Graph2에서만 사용 가능
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

            const incomers = node.incomers('edge');

            incomers.forEach((edge) => {
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

    useEffect(() => {
        loadGraph(null);

        window.forceReRenderNode = (nodeId) => {
            const cy = cyInstanceRef.current;
            const node = cy.getElementById(nodeId);
            node.addClass('force-re-render');
            node.removeClass('force-re-render');

            // metric card 정보 업데이트
            const name = node.data('name');
            const amount = nodeRef.current[nodeId].amount;
            updateMetricDataHelper(name, amount, setMetricData);
        };

        window.handleToggleClick = (nodeId) => {
            const cy = cyInstanceRef.current;
            const ref = nodeRef.current[nodeId];
            if (!ref) return;

            if (ref.expanded) {
                collapseNode(nodeId);
            } else {
                expandNode(nodeId);
                cy.animate({
                    panBy: { x: -60, y: 0 },
                    duration: 400,
                    easing: 'ease-in-out',
                });
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

        window.updateHistoryData = (nodeId) => {
            const ref = nodeRef.current[nodeId];
            const percentage = ref.percentage;
            if (ref.historyData.length < 10) {
                ref.historyData.push(percentage);
            } else {
                ref.historyData.shift();
                ref.historyData.push(percentage);
            }

            const maxAbs = Math.max(...ref.historyData.map((h) => Math.abs(h)));
            const isNeedAutoScale = 19 < maxAbs;
            const scale = isNeedAutoScale ? 19 / maxAbs : 1;

            ref.scaledHistoryData = ref.historyData.map((h) => {
                if (h === 0) return 0;
                const height = Math.max(Math.abs(h) * scale, 1);
                return h > 0 ? height : -height;
            });
        };

        window.handleInputChange = (nodeId, initialAmount, percentageValue) => {
            const cy = cyInstanceRef.current;
            if (!cy || !nodeId) return;

            if (!nodeRef.current[nodeId]) {
                nodeRef.current[nodeId] = {};
            }

            // 현재 값 계산 및 저장
            const calculatedAmount = initialAmount * (1 + Number(percentageValue) / 100);

            nodeRef.current[nodeId].amount = Math.round(calculatedAmount); // TODO: Math.round()
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

            // historyData 추가
            updateHistoryData(nodeId);
        };

        window.updateParentNodes = (nodeId) => {
            const cy = cyInstanceRef.current;
            const node = cy.getElementById(nodeId);

            // TODO: 부모가 여러개라면?
            const parentNode = node.outgoers('node');
            const parentNodeId = parentNode.id();
            if (!parentNode.data('name')) return;

            const childrenEdges = parentNode.incomers('edge');
            let parentNodeAmount = 0;
            childrenEdges.forEach((childrenEdge) => {
                const role = childrenEdge.data('role');
                const childNodeId = childrenEdge.source().id();
                const childNodeAmount = nodeRef.current[childNodeId].amount;
                if (role === 'negative') {
                    parentNodeAmount -= childNodeAmount;
                } else {
                    parentNodeAmount += childNodeAmount;
                }
            });

            const parentPercentage = Math.round(
                (parentNodeAmount / nodeRef.current[parentNodeId].initialAmount - 1) * 100
            ); // TODO: Math.round()
            nodeRef.current[parentNodeId].amount = parentNodeAmount;
            nodeRef.current[parentNodeId].percentage = parentPercentage;

            // historyData 추가
            updateHistoryData(parentNodeId);

            forceReRenderNode(parentNodeId);
            updateParentNodes(parentNodeId);
        };

        window.clickHistoryData = (nodeId, index, event) => {
            const percentage = nodeRef.current[nodeId].historyData[index];

            const barElement = document.querySelectorAll(
                `.cy-node-label-html[data-node-id="${nodeId}"] .history-graph div`
            )[index];
            const tooltip = document.getElementById('tooltip');

            if (!barElement || !tooltip) return;

            const rect = barElement.getBoundingClientRect();

            tooltip.textContent = `${percentage}%`;
            const mouseX = event.clientX + window.scrollX;
            const mouseY = event.clientY + window.scrollY;

            tooltip.style.left = `${mouseX + 10}px`; // 약간 오른쪽
            tooltip.style.top = `${mouseY - 10}px`; // 약간 위쪽
            tooltip.style.display = 'block';

            setTimeout(() => {
                tooltip.style.display = 'none';
            }, 500);
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
                        width: 380,
                        height: 74,
                        shape: 'rectangle',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        label: (ele) => {
                            return `${ele.data('role') === 'negative' ? '-' : '+'}`;
                        },
                        color: (ele) => {
                            return ele.data('role') === 'negative' ? 'red' : 'black';
                        },
                        width: 1,
                        'font-size': '30px',
                        'line-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'target-arrow-color': '#ccc',
                        'curve-style': 'round-taxi',
                        'taxi-direction': 'leftward',
                        'taxi-turn': 100,
                        'taxi-turn-min-distance': 10,
                    },
                },
            ],
        });

        cy.add([...graphData.nodes, ...graphData.edges]);

        const layout = cy
            .layout({
                name: 'dagre',
                rankDir: 'RL', // 방향: 오른쪽 → 왼쪽
                nodeSep: 3, // 같은 레벨 노드 간 거리
                rankSep: 70, // 부모, 자식 노드 간 거리
                edgeSep: 10,
                padding: 20,
                animate: true,
                animationDuration: 400,
                animationEasing: 'ease-in-out',
            })
            .run();

        cy.nodeHtmlLabel([
            {
                query: 'node',
                halign: 'center',
                valign: 'center',
                tpl: (data) => {
                    const ref = nodeRef.current?.[data.id] || {};
                    if (ref.isDisplay === false) return '';

                    const node = cy.getElementById(data.id);

                    const initialAmount = Math.round(parseNeo4jInt(data.amount) / 1_000_000); // TODO: 백만원 단위
                    if (ref.initialAmount === undefined) {
                        ref.initialAmount = initialAmount;
                    }

                    const amountValue = ref.amount === undefined ? initialAmount : ref.amount;
                    ref.amount = amountValue;

                    const percentageValue = ref.percentage === undefined ? 0 : ref.percentage;
                    const disabled = ref.disabled ? 'disabled' : '';

                    const expanded = ref.expanded === true;
                    const toggleSymbol = expanded ? '&lt;' : '&gt;';

                    const allChildNodes = node.predecessors('node');
                    const isLeaf = allChildNodes.length === 0;

                    const excludedNames = ['액티비티수차합', '액티비티단가합', '생산입고', '공정출고', '비용계획합'];

                    if (!ref.historyData) {
                        ref.historyData = [];
                    }
                    const scaledHistoryData = ref.scaledHistoryData ? ref.scaledHistoryData : [];

                    return `
                <div 
                    class="cy-node-label-html" 
                    data-node-id="${data.id}"
                    onmouseover="showInput('${data.id}');"
                    onmouseout="hideInput('${data.id}');"
                    style="
                        pointer-events:auto; 
                        background: white;
                        border: 2px solid #90caf9;
                        border-radius: 10px;
                        box-shadow: 0 1px 5px rgba(0,0,0,0.1);
                        padding: 10px;
                        width: 400px;
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
                
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; justify-content: center; align-items: center;">
                            <div style="margin-right: 10px">${data.name}</div>
                            ${
                                !excludedNames.includes(data.name)
                                    ? `<div class="percentage">${percentageValue}%</div>`
                                    : ''
                            }
                        </div>     
                        <div>Unit: 백만원</div>
                    </div>
                
                    <div>₩ ${amountValue.toLocaleString('ko-KR')}</div>
                    
                            ${
                                excludedNames.includes(data.name)
                                    ? ''
                                    : `
                                        <div style="display: flex; justify-content: space-between">
                                            <div style="display: flex; flex-direction: column;">
                                                <div style="display: flex; justify-content: space-between;">
                                                    <div>Old Amt:</div>
                                                    <div style="text-align: right; min-width: 100px;">₩ ${initialAmount.toLocaleString(
                                                        'ko-KR'
                                                    )}</div>
                                                </div>
                                                <div style="display: flex; justify-content: space-between;">
                                                    <div>Chg Amt:</div>
                                                    <div style="text-align: right; min-width: 100px;">₩ ${(
                                                        amountValue - initialAmount
                                                    ).toLocaleString('ko-KR')}</div>
                                                </div>    
                                            </div>
                                            <div>
                                                <div>Last 10 records</div>                                        
                                                <div class="history-graph" style="height: 40px; display: flex; flex-direction: column;">
                                                    <div style="height: 19px; display: flex; align-items: flex-end; gap: 2px;">
                                                        ${scaledHistoryData
                                                            .map((h, i) => {
                                                                const color = h >= 0 ? 'orange' : 'transparent';
                                                                const height = h > 0 ? h : 0;
                                                                return `<div 
                                                                    onmousedown="event.stopPropagation(); 
                                                                    clickHistoryData('${data.id}', ${i}, event);"
                                                                    style="width: 8px; height: ${height}px; background: ${color}; ${
                                                                    color === 'transparent'
                                                                        ? 'pointer-events: none;'
                                                                        : 'cursor: pointer;'
                                                                }"></div>`;
                                                            })
                                                            .join('')}
                                                    </div>
                                                    <div style="height: 2px;"></div>
                                                    <div style="height: 19px; display: flex; align-items: flex-start; gap: 2px;">
                                                        ${scaledHistoryData
                                                            .map((h, i) => {
                                                                const color = h < 0 ? 'red' : 'transparent';
                                                                const height = h < 0 ? -h : 0;
                                                                return `<div 
                                                                    onmousedown="event.stopPropagation(); 
                                                                    clickHistoryData('${data.id}', ${i}, event);"
                                                                    style="width: 8px; height: ${height}px; background: ${color}; ${
                                                                    color === 'transparent'
                                                                        ? 'pointer-events: none;'
                                                                        : 'cursor: pointer;'
                                                                }"></div>`;
                                                            })
                                                            .join('')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="range-input" style="display: none;"> 
                                            <div style="display: flex; justify-content: center; align-items: center"> 
                                                <div style="margin-right: 10px">
                                                    <button style="padding: 3px 3px 3px 3px">KEEP</button>
                                                </div>
                                                <input 
                                            type="range"
                                            ${disabled}
                                            value="${percentageValue}"
                                            min="-15"
                                            max="15"
                                            oninput="
                                                const percentageDivs = this.closest('.cy-node-label-html')?.querySelectorAll('.percentage');
                                                if (percentageDivs) {
                                                    percentageDivs.forEach(div => {
                                                    div.textContent = this.value + '%';
                                                })}"
                                            onmouseup="
                                                handleInputChange('${data.id}', ${initialAmount}, this.value);
                                                forceReRenderNode('${data.id}');
                                                updateParentNodes('${data.id}');
                                            "
                                            onmousedown="event.stopPropagation();"
                                            onmousemove="event.stopPropagation();"
                                            style="width: 100px; margin-right: 10px; pointer-events: auto;"
                                            />
                                                <div class="percentage">${percentageValue}%</div>
                                            </div>
                                        </div>    
                                    `
                            }
                </div>
                `;
                },
            },
        ]);

        cy.on('tap', 'node', (event) => {
            const node = event.target;
            console.log('✅ 노드 위치:', node.position());
        });

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

        // metric card 정보 업데이트
        cy.nodes().forEach((node) => {
            const name = node.data('name');
            const amount = Math.round(parseNeo4jInt(node.data('amount')) / 1_000_000);
            updateMetricDataHelper(name, amount, setMetricData);
        });

        layout.on('layoutstop', () => {
            roots.forEach((root) => {
                showNode(root, 2);
                const rootId = root.id();
                nodeRef.current[rootId].isDisplay = true;
                nodeRef.current[rootId].expanded = false;
            });

            cy.zoom({
                level: 0.6,
            });

            cy.center(roots);

            cy.nodes().forEach((node) => {
                const name = node.data('name');

                if (name === '매출원가') {
                    node.position({ x: 800, y: 500 });
                }

                if (name === '매출액') {
                    node.position({ x: 800, y: 800 });
                }

                if (name === '당기제품제조원가') {
                    node.position({ x: 1347.24006, y: -8.5279 });
                }

                if (name === '기초재고') {
                    node.position({ x: 1379.8862, y: 149.7574 });
                }

                if (name === '기말재고') {
                    node.position({ x: 1409.49807, y: 303.7961 });
                }

                if (name === 'FERT100s') {
                    node.position({ x: 1409.49807, y: 707.432 });
                }

                if (name === 'FERT200s') {
                    node.position({ x: 1409.49807, y: 905.5379 });
                }

                if (name === '당기제조비용') {
                    node.position({ x: 1953.72918, y: -265.6079 });
                }

                if (name === '재공품') {
                    node.position({ x: 1987.308, y: -105.632 });
                }

                if (name === '액티비티단수차') {
                    node.position({ x: 1987.308, y: 59 });
                }

                if (name === '액티비티배부') {
                    node.position({ x: 1953.72918, y: 228.366 });
                }

                if (name === '생산입고') {
                    node.position({ x: 2556, y: -174 });
                }

                if (name === '공정출고') {
                    node.position({ x: 2556, y: -40 });
                }

                if (name === '가공비') {
                    node.position({ x: 2586.428, y: -265.6079 });
                }

                if (name === '부재료비') {
                    node.position({ x: 2549.776, y: -434.716 });
                }

                if (name === '원재료비') {
                    node.position({ x: 2514.79, y: -595.7439 });
                }

                console.log(name, node.position());
            });
        });

        cyInstanceRef.current = cy;
    }, [graphData]);

    return (
        <>
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
            <div
                id="tooltip"
                style={{
                    position: 'absolute',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    boxShadow: '0px 2px 5px rgba(0,0,0,0.2)',
                    pointerEvents: 'none',
                    display: 'none',
                    zIndex: 1000,
                    fontSize: '12px',
                }}
            />
        </>
    );
}
