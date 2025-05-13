"use client";

import cytoscape from "cytoscape";
import cxtmenu from "cytoscape-cxtmenu";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { graphDataAtom } from "@/lib/graphAtoms";
import styles from "../_components/graphViewer.module.css";

export default function GraphViewer({ onReady, onHover, onUnhover }) {
  cytoscape.use(cxtmenu);

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
          content: "👁 숨기기",
          select: function (ele) {
            ele.hide();
            ele.connectedEdges().hide();
          },
        },
        {
          content: "⛓ 확장하기",
          select: function (ele) {
            console.log("확장 실행:", ele.id());
            // 예시용: 실제로는 fetch()로 데이터 로딩 후 cy.add()
          },
        },
        {
          content: "❌ 닫기",
          select: function () {
            // 메뉴 닫기 (기본 동작)
          },
        },
      ],
      fillColor: "rgba(255, 255, 255, 0.9)",
      activeFillColor: "rgba(100, 100, 255, 0.3)",
      activePadding: 8,
      indicatorSize: 16,
      separatorWidth: 2,
      spotlightPadding: 4,
      minSpotlightRadius: 20,
      maxSpotlightRadius: 40,
      openMenuEvents: "cxttap",
      itemColor: "#333",
      itemTextShadowColor: "#fff",
    });

    cy.add([...graphData.nodes, ...graphData.edges]);
    cy.layout({
      name: "cose",
      animate: true,
      padding: 30,
    }).run();

    cy.on("tap", "node", (evt) => {
      console.log("노드 클릭:", evt.target.data());
    });

    cy.on("tap", "edge", (evt) => {
      console.log("엣지 클릭:", evt.target.data());
    });

    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      node.addClass("hover");
      onHover?.(evt.target.data());
    });

    cy.on("mouseout", "node", (evt) => {
      const node = evt.target;
      node.removeClass("hover");
      onUnhover?.();
    });

    onReady?.(cy);
  }, [graphData]);

  return <div id="cy" ref={cyRef} className={styles.cy} />;
}
