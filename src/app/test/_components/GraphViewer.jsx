"use client";

import cytoscape from "cytoscape";
import cxtmenu from "@/lib/cytoscapeWithCxtmenu";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { graphDataAtom } from "@/lib/graphAtoms";
import styles from "../_components/graphViewer.module.css";

export default function GraphViewer({ onReady, onHover, onUnhover }) {
  if (!cytoscape.prototype.hasOwnProperty("cxtmenu")) {
    cytoscape.use(cxtmenu);
  }
  const cyRef = useRef(null);
  const [graphData] = useAtom(graphDataAtom);

  function parseNeo4jInt(n) {
    if (typeof n === "number") return n;
    if (n && typeof n.low === "number" && typeof n.high === "number") {
      const isNegative = n.high < 0;
      const lowUnsigned = n.low >>> 0;
      const highAbs = isNegative ? ~n.high + 1 : n.high;
      // 64비트 정수 계산
      const result = highAbs * 2 ** 32 + lowUnsigned;
      // 음수 보정
      return isNegative ? -result : result;
    }
    return 0;
  }

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cytoscape({
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
              } ${amount}`;
            },
            width: 0.4,
            "text-wrap": "wrap",
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "arrow-scale": "0.4",
            "curve-style": "straight",
            "font-size": "4px",
            // color: "#d62828",
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
            const queue = [{ node: ele, depth: 0 }];

            while (queue.length > 0) {
              const { node, depth } = queue.shift();
              const nodeId = node.id();
              if (visited.has(nodeId)) continue;
              visited.add(nodeId);

              const isHidden = node.data("isHidden");

              // ✅ depth 0~1이면 숨김 상관없이 복원
              // ✅ depth 2 이상이면 숨김이면 skip
              if (depth <= 1 || !isHidden) {
                node.show();
                node.data("isHidden", false);
              } else {
                console.log(`❌ depth ${depth} 노드 ${nodeId}는 숨김이라 skip`);
                continue;
              }

              const edges = node.connectedEdges();
              edges.forEach((edge) => {
                edge.show();

                edge.connectedNodes().forEach((nextNode) => {
                  if (!visited.has(nextNode.id())) {
                    queue.push({ node: nextNode, depth: depth + 1 });
                  }
                });
              });
            }

            console.log(
              "확장 완료 (직접 연결된 숨김 노드는 복원, 간접 숨김 노드는 제외)"
            );
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
    cy.layout({
      name: "cose",
      animate: true,
      padding: 30,
    }).run();

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

    onReady?.(cy);
  }, [graphData]);

  return <div id="cy" ref={cyRef} className={styles.cy} />;
}
