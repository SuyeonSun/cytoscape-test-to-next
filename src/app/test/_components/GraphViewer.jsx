"use client";

import cytoscape from "cytoscape";
import cxtmenu from "@/lib/cytoscapeWithCxtmenu";
import klay from "@/lib/cytoscapeWithKlay";
import dagre from "@/lib/cytoscapeWithDagre";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { graphDataAtom } from "@/store/graphAtoms";
import styles from "../_components/graphViewer.module.css";

import { formatAmountWithMajorUnits } from "@/utils/formatUtils";
import { parseNeo4jInt } from "@/utils/neo4jUtils";

export default function GraphViewer({ onReady, onHover, onUnhover }) {
  if (!cytoscape.prototype.hasOwnProperty("cxtmenu")) {
    cytoscape.use(cxtmenu);
  }
  const cyRef = useRef(null);
  const cyInstanceRef = useRef(null); // 전역 참조

  const [graphData] = useAtom(graphDataAtom);

  let cy;
  useEffect(() => {
    if (!cyRef.current) return;
    cy = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: "node",
          style: {
            label: (ele) => ele.data("name"),
            "text-valign": "center",
            "text-halign": "center",
            "font-size": "4px",
            color: "#333",
            width: "20px",
            height: "20px",
            "text-wrap": "wrap",
            "text-max-width": "20px",
          },
        },
        {
          selector: "edge",
          style: {
            label: (ele) => {
              const type = ele.data("type") || "";
              const amount = parseNeo4jInt(ele.data("amount"));
              return `${type}\n${
                ele.data("role") === "negative" ? "(-)" : "(+)"
              } ${formatAmountWithMajorUnits(amount)}`;
            },
            width: 0.4,
            "text-wrap": "wrap",
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "arrow-scale": "0.4",
            "curve-style": "straight",
            "font-size": "4px",
            color: (ele) => {
              return ele.data("role") === "negative" ? "#d62828" : "#2a9d8f";
            },
            "edge-text-rotation": "autorotate",
            "text-background-shape": "rectangle",
            "text-background-opacity": 1,
            "text-background-color": "#fff",
          },
        },
      ],
    });

    // cxtmenu
    cy.cxtmenu({
      selector: "node",
      commands: [
        {
          content: "숨김",
          select: function (ele) {
            ele.hide();
            ele.connectedEdges().forEach((edge) => edge.hide());
            // ele.connectedEdges().hide();
            ele.data("isHidden", true); // 선택적으로 hidden 상태 표시
          },
        },
        {
          content: "확장",
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
                  const isRootNode = nodeId === rootId; // 지금 탐색 중인 노드가 클릭한 노드인가?

                  if (!isRootNode) {
                    console.log(
                      `❌ ${next.id()}는 root의 직접 자식이 아니므로 skip`
                    );
                    return;
                  }
                  edge.show();
                  next.show();
                  next.data("isHidden", false);
                  queue.push({ node: next, from: nodeId });
                } else {
                  const prev = source;
                  const isRootTarget = target.id() === rootId;

                  if (!isRootTarget && prev.data("isHidden")) {
                    console.log(
                      `❌ ${prev.id()}는 root의 부모지만 root의 직접 연결 아니므로 skip`
                    );
                    return;
                  }

                  edge.show();
                  prev.show();
                  prev.data("isHidden", false);
                  queue.push({ node: prev, from: nodeId });
                }
              });
            }
          },
        },
        {
          content: "닫기",
          select: function () {
            // 메뉴 닫기 (기본 동작)
          },
        },
        {
          content: "정보",
          select: function (ele) {
            const connectedEdges = ele.connectedEdges();
            const connectedNodes = connectedEdges
              .connectedNodes()
              .filter((n) => n.id() !== ele.id());

            const nodeDetails = connectedNodes.map((n) => n.data());
            const edgeDetails = connectedEdges.map((e) => e.data());

            console.log("연결된 노드:", nodeDetails);
            console.log("연결된 엣지:", edgeDetails);
          },
        },
      ],
      openMenuEvents: "tap", // 좌클릭 대응
      fillColor: "#eaeaea", // 배경 회색
      activeFillColor: "#ccc", // 선택 시 하이라이트
      activePadding: 5,
      indicatorSize: 8,
      separatorWidth: 2,
      spotlightPadding: 4,
      menuRadius: 48,
      spotlightRadius: 22, // 중앙 원 크기
      minSpotlightRadius: 22,
      maxSpotlightRadius: 22,
      itemColor: "#444", // 아이콘 색상
      itemTextShadowColor: "transparent",
    });

    cy.add([...graphData.nodes, ...graphData.edges]);

    // cy.layout({
    //   name: "cose",
    //   animate: true,
    //   padding: 30,
    // }).run();

    cy.layout({
      name: "dagre",
      rankDir: "RL", // Left to Right
    }).run();

    const root = cy.nodes().filter((node) => node.indegree() === 0)[0];
    console.log("루트 노드 ID:", root);

    // cy.on("tap", "node", (evt) => {
    //   console.log("노드 클릭:", evt.target.data());
    // });

    cy.on("tap", "edge", (evt) => {
      console.log("엣지 클릭:", evt.target.data());
    });

    // cy.on("mouseover", "node", (evt) => {
    //   const node = evt.target;
    //   node.addClass("hover");
    //   onHover?.(evt.target.data());
    // });

    // cy.on("mouseout", "node", (evt) => {
    //   const node = evt.target;
    //   node.removeClass("hover");
    //   onUnhover?.();
    // });
    cyInstanceRef.current = cy;
    onReady?.(cy);
  }, [graphData]);

  const applyRadialLayout = () => {
    cyInstanceRef.current
      ?.layout({
        name: "cose",
        animate: true,
        padding: 30,
      })
      .run();
  };

  const applyMindmapLayout = () => {
    cyInstanceRef.current
      ?.layout({
        name: "dagre",
        rankDir: "RL",
      })
      .run();
  };

  return (
    <>
      <div style={{ marginBottom: "8px" }}>
        <button onClick={applyRadialLayout}>🔘 방사형 레이아웃</button>
        <button onClick={applyMindmapLayout} style={{ marginLeft: "8px" }}>
          🧠 마인드맵 레이아웃
        </button>
      </div>

      <div id="cy" ref={cyRef} className={styles.cy} />
    </>
  );
}
