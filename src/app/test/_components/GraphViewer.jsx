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
            width: 0.4,
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "arrow-scale": "0.4",
            "curve-style": "straight",
            label: (ele) => ele.data("type") || "",
            "font-size": "4px",
            color: "#555",
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
          content: "❌",
          select: function (ele) {
            ele.hide();
            ele.connectedEdges().hide();
            ele.data("isHidden", true); // 선택적으로 hidden 상태 표시
          },
        },
        {
          content: "➕",
          openMenuEvents: "tap",
          select: function (ele) {
            const connected = ele.connectedEdges().connectedNodes();
            const edges = ele.connectedEdges();

            connected.forEach((n) => {
              if (!n.visible()) n.show();
            });

            edges.forEach((e) => {
              if (!e.visible()) e.show();
            });

            console.log("✅ 연결된 노드와 엣지 복원 완료");
          },
        },
        {
          content: "❌",
          select: function () {
            // 메뉴 닫기 (기본 동작)
          },
        },
        {
          content: "…",
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
      openMenuEvents: "tap",
      fillColor: "#F4F4F4",
      activeFillColor: "rgba(100, 100, 255, 0.3)",
      activePadding: 2, // 메뉴 항목 내부 여백 최소화
      indicatorSize: 16, // 마우스 방향 표시 줄임
      separatorWidth: 2, // 구분선
      spotlightPadding: 8,
      minSpotlightRadius: 3,
      maxSpotlightRadius: 3,
      itemColor: "#333",
      itemTextShadowColor: "#fff",
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

    // cy.on("tap", "edge", (evt) => {
    //   console.log("엣지 클릭:", evt.target.data());
    // });

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
