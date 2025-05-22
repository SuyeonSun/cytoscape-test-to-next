'use client';

import cytoscape from '@/lib/cytoscapeWithExtensions';
// import klay from '@/lib/cytoscapeWithKlay';
// import dagre from '@/lib/cytoscapeWithDagre';

import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { graphDataAtom } from '@/store/graphAtoms';
import styles from '../_components/graphViewer.module.css';

import { formatAmountWithMajorUnits } from '@/utils/formatUtils';
import { parseNeo4jInt } from '@/utils/neo4jUtils';
import { LAYOUT_MODES } from '@/constants/layoutConstant';

export default function GraphViewer({ onReady, onHover, onUnhover }) {
    const cyRef = useRef(null);
    const cyInstanceRef = useRef(null);
    const [layoutMode, setLayoutMode] = useState(LAYOUT_MODES.MINDMAP);
    const layoutModeRef = useRef(LAYOUT_MODES.MINDMAP);

    const [graphData] = useAtom(graphDataAtom);

    const hideNode = (node, layoutMode) => {
        node.hide();
        if (layoutMode === LAYOUT_MODES.MINDMAP) {
            node.style('opacity', 0);
        }
        node.data('isHidden', true);
    };

    const showNode = (node, layoutMode, duration = 800) => {
        node.show();
        node.data('isHidden', false);

        if (layoutMode === LAYOUT_MODES.MINDMAP) {
            requestAnimationFrame(() => {
                node.animate({ style: { opacity: 1 }, duration });
            });
        }

        if (layoutMode === LAYOUT_MODES.RADIAL) {
            node.style('opacity', 1);
        }

        if (layoutMode === LAYOUT_MODES.DAGRE) {
            node.style('opacity', 1);
        }
    };

    const hideEdge = (edge, layoutMode) => {
        edge.hide();
        if (layoutMode === LAYOUT_MODES.MINDMAP) {
            edge.style('opacity', 0);
        }
        edge.data('isHidden', true);
    };

    const showEdge = (edge, layoutMode, duration = 800) => {
        if (edge.data('isHidden')) {
            edge.show();
            edge.data('isHidden', false);

            if (layoutMode === LAYOUT_MODES.MINDMAP) {
                // edge.style('opacity', 1);
                requestAnimationFrame(() => {
                    edge.animate({ style: { opacity: 1 }, duration });
                });
            }

            if (layoutMode === LAYOUT_MODES.RADIAL) {
                edge.style('opacity', 1);
            }

            if (layoutMode === LAYOUT_MODES.DAGRE) {
                edge.style('opacity', 1);
            }
        }
    };

    const setLayoutModeWithRef = (mode) => {
        layoutModeRef.current = mode;
        setLayoutMode(mode);
    };

    useEffect(() => {
        if (!cyRef.current) return;
        const cy = cytoscape({
            container: cyRef.current,
            style: [
                {
                    selector: 'node',
                    style: {
                        label: (ele) => ele.data('name'),
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '4px',
                        backgroundColor: (ele) => {
                            const level = parseNeo4jInt(ele.data('level'));
                            if (level === 0) return '#e57373';
                            else if (level === 1) return '#90a4ce';
                            else if (level === 2) return '#26A69A';
                            else if (level === 3) return '#64b5f6';
                            else if (level === 4) return '#B2DFDB';
                            else return '#ddd'; // fallback
                        },
                        color: '#333',
                        width: '20px',
                        height: '20px',
                        'text-wrap': 'wrap',
                        'text-max-width': '20px',
                    },
                },
                {
                    selector: 'edge',
                    style: {
                        // label: (ele) => {
                        //     const type = ele.data('type') || '';
                        //     const amount = parseNeo4jInt(ele.data('amount'));
                        //     return `${type}\n${
                        //         ele.data('role') === 'negative' ? '(-)' : '(+)'
                        //     } ${formatAmountWithMajorUnits(amount)}`;
                        // },
                        width: 0.4,
                        'text-wrap': 'wrap',
                        'line-color': '#ccc',
                        'target-arrow-color': '#ccc',
                        'target-arrow-shape': 'triangle',
                        'arrow-scale': '0.4',
                        'font-size': '4px',
                        color: (ele) => (ele.data('role') === 'negative' ? '#d62828' : '#2a9d8f'),
                        'edge-text-rotation': 'autorotate',
                        'text-background-shape': 'rectangle',
                        'text-background-opacity': 1,
                        'text-background-color': '#fff',
                    },
                },
            ],
        });

        cy.cxtmenu({
            selector: 'node',
            commands: [
                {
                    content: '숨김',
                    select: function (ele) {
                        hideNode(ele, layoutModeRef.current);
                        ele.connectedEdges().forEach((edge) => {
                            hideEdge(edge, layoutModeRef.current);
                        });
                    },
                },
                {
                    content: '확장',
                    select: function (ele) {
                        const visited = new Set();
                        const queue = [{ node: ele, from: null }];
                        const rootId = ele.id();

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

                                    showEdge(edge, layoutModeRef.current);
                                    showNode(next, layoutModeRef.current);

                                    queue.push({ node: next, from: nodeId });
                                } else {
                                    const prev = source;
                                    const isRootTarget = target.id() === rootId;
                                    if (!isRootTarget && prev.data('isHidden')) return;

                                    showEdge(edge, layoutModeRef.current);
                                    showNode(prev, layoutModeRef.current);

                                    queue.push({ node: prev, from: nodeId });
                                }
                            });
                        }
                    },
                },
                {
                    content: '통합',
                    select: function (ele) {
                        const visited = new Set();
                        const queue = [ele];

                        while (queue.length > 0) {
                            const node = queue.shift();
                            const nodeId = node.id();
                            if (visited.has(nodeId)) continue;
                            visited.add(nodeId);

                            const incomingEdges = node.connectedEdges().filter((edge) => edge.target().id() === nodeId);

                            incomingEdges.forEach((edge) => {
                                const source = edge.source();

                                hideEdge(edge, layoutModeRef.current);
                                hideNode(source, layoutModeRef.current);

                                queue.push(source);
                            });
                        }
                    },
                },
                {
                    content: '정보',
                    select: function (ele) {
                        const connectedEdges = ele.connectedEdges();
                        const connectedNodes = connectedEdges.connectedNodes().filter((n) => n.id() !== ele.id());
                        console.log(
                            '연결된 노드:',
                            connectedNodes.map((n) => n.data())
                        );
                        console.log(
                            '연결된 엣지:',
                            connectedEdges.map((e) => e.data())
                        );
                    },
                },
            ],
            openMenuEvents: 'tap', // ''
            outsideMenuCancel: 1,
            fillColor: '#eaeaea',
            activeFillColor: '#ccc',
            activePadding: 5,
            indicatorSize: 8,
            separatorWidth: 2,
            spotlightPadding: 4,
            menuRadius: 48,
            spotlightRadius: 22,
            minSpotlightRadius: 22,
            maxSpotlightRadius: 22,
            itemColor: '#444',
            itemTextShadowColor: 'transparent',
        });

        cy.add([...graphData.nodes, ...graphData.edges]);

        cy.on('cxttap', 'node', (evt) => {
            if (layoutModeRef.current === LAYOUT_MODES.DAGRE) {
                const currentZoom = cy.zoom();
                const targetZoom = 2;
                if (currentZoom < targetZoom) {
                    cy.animate({
                        center: { eles: evt.target },
                        zoom: targetZoom,
                        duration: 500,
                        easing: 'ease-in-out',
                    });
                }
            }
        });

        cy.on('tap', 'node', (evt) => {
            console.log('노드 클릭:', evt.target.data());
        });

        cy.on('tap', 'edge', (evt) => {
            console.log('엣지 클릭:', evt.target.data());
        });

        cyInstanceRef.current = cy;

        if (layoutMode === LAYOUT_MODES.RADIAL) applyRadialLayout();
        else if (layoutMode === LAYOUT_MODES.MINDMAP) applyMindmapLayout();
        else if (layoutMode === LAYOUT_MODES.DAGRE) applyDagreLayout();

        onReady?.(cy);
    }, [graphData]);

    const applyRadialLayout = () => {
        setLayoutModeWithRef(LAYOUT_MODES.RADIAL);
        const cy = cyInstanceRef.current;
        cy.nodes().forEach((node) => {
            showNode(node, layoutModeRef.current);
        });
        cy.edges().forEach((edge) => {
            showEdge(edge, layoutModeRef.current);
        });

        cy.layout({ name: 'cose', animate: true, padding: 30 }).run();
        cy.style().selector('node').style({
            shape: 'ellipse',
            width: '20px',
            height: '20px',
        });
        cy.style().selector('edge').style({ 'curve-style': 'straight' }).update();

        // cyInstanceRef.current = cy;
    };

    const applyDagreLayout = () => {
        setLayoutModeWithRef(LAYOUT_MODES.DAGRE);
        const cy = cyInstanceRef.current;
        cy.nodes().forEach((node) => {
            showNode(node, layoutModeRef.current);
        });
        cy.edges().forEach((edge) => {
            showEdge(edge, layoutModeRef.current);
        });

        cy.layout({
            name: 'dagre',
            rankDir: 'RL',
            nodeSep: 5, // 같은 레벨에서 노드 간 간격
            rankSep: 40, // 레벨 간 edge 길이
            edgeSep: 30, // 동일 레벨에서의 edge 길이
            padding: 20,
            animate: true,
        }).run();

        cy.style().selector('node').style({
            shape: 'ellipse',
            width: '20px',
            height: '20px',
        });

        cy.style().selector('edge').style({ 'curve-style': 'round-taxi' }).update(); // "straight"

        // cyInstanceRef.current = cy;
    };

    const applyMindmapLayout = () => {
        setLayoutModeWithRef(LAYOUT_MODES.MINDMAP);
        const cy = cyInstanceRef.current;
        if (!cy) return;

        cy.nodes().forEach((node) => {
            hideNode(node, layoutModeRef.current);
        });
        cy.edges().forEach((edge) => {
            hideEdge(edge, layoutModeRef.current);
        });

        const roots = cy.nodes().filter((node) => node.outgoers('edge').length === 0);
        if (roots.length === 0) {
            console.log('루트 노드를 찾을 수 없습니다.');
            return;
        }

        cy.style().selector('node').style({
            shape: 'rectangle',
            width: '30px',
            height: '20px',
        });

        cy.style()
            .selector('edge')
            .style({
                'curve-style': 'round-taxi',
                'taxi-direction': 'horizontal',
                'taxi-turn': 20,
                'taxi-turn-min-distance': 15,
                'edge-distances': 'node-position',
            })
            .update();

        const layout = cy.layout({
            name: 'dagre',
            rankDir: 'RL',
            nodeSep: 15,
            rankSep: 50,
            edgeSep: 25,
            padding: 20,
            animate: true,
        });

        layout.run();

        layout.on('layoutstop', () => {
            roots.forEach((root) => {
                root.show();
                root.data('isHidden', false);
                root.animate({ style: { opacity: 1 }, duration: 5 });
            });

            cy.zoom({
                level: 2.0,
                // position: { x: 0, y: 0 },
            });
            cy.center(roots);
        });

        // cyInstanceRef.current = cy;
    };

    const buttonStyle = {
        padding: '6px 12px',
        fontSize: '13px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        backgroundColor: '#ffffff',
        color: '#333',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    };

    const getButtonBgColor = (mode) => {
        switch (mode) {
            case 'mindMap':
                return '#e8f5e9';
            case 'radial':
                return '#e3f2fd';
            case 'dagre':
                return '#f3e5f5';
            default:
                return '#ffffff';
        }
    };

    return (
        <div style={{ fontFamily: 'sans-serif', paddingBottom: '12px' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                }}
            >
                <button
                    onClick={applyRadialLayout}
                    style={{
                        ...buttonStyle,
                        backgroundColor: layoutMode === 'radial' ? getButtonBgColor('radial') : '#fff',
                    }}
                >
                    기본 방사형 레이아웃
                </button>
                <button
                    onClick={applyDagreLayout}
                    style={{
                        ...buttonStyle,
                        backgroundColor: layoutMode === 'dagre' ? getButtonBgColor('dagre') : '#fff',
                    }}
                >
                    기본 dagre 레이아웃
                </button>
                <button
                    onClick={applyMindmapLayout}
                    style={{
                        ...buttonStyle,
                        backgroundColor: layoutMode === 'mindMap' ? getButtonBgColor('mindMap') : '#fff',
                    }}
                >
                    🧠 VTD 스타일
                </button>
            </div>

            <div id="cy" ref={cyRef} className={styles.cy} />
        </div>
    );
}
