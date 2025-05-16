// updated full code block incorporating smooth fade-in for mindmap layout with layoutModeRef

"use client";

import cytoscape from "cytoscape";
import cxtmenu from "@/lib/cytoscapeWithCxtmenu";
import klay from "@/lib/cytoscapeWithKlay";
import dagre from "@/lib/cytoscapeWithDagre";

import { useEffect, useRef, useState } from "react";
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
  const cyInstanceRef = useRef(null);
  const [layoutMode, setLayoutMode] = useState("mindmap");
  const layoutModeRef = useRef("mindmap");

  const [graphData] = useAtom(graphDataAtom);

  useEffect(() => {
    layoutModeRef.current = layoutMode;
  }, [layoutMode]);

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
              } ${formatAmountWithMajorUnits(amount)}`;
            },
            width: 0.4,
            "text-wrap": "wrap",
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "arrow-scale": "0.4",
            "font-size": "4px",
            color: (ele) =>
              ele.data("role") === "negative" ? "#d62828" : "#2a9d8f",
            "edge-text-rotation": "autorotate",
            "text-background-shape": "rectangle",
            "text-background-opacity": 1,
            "text-background-color": "#fff",
          },
        },
      ],
    });

    cy.cxtmenu({
      selector: "node",
      commands: [
        {
          content: "숨김",
          select: function (ele) {
            if (layoutModeRef.current === "mindmap") {
              console.log("===================== mindmap");
              ele.hide();
              ele.style("opacity", 0);
              ele.connectedEdges().forEach((edge) => {
                edge.style("opacity", 0);
                edge.hide();
              });
              ele.data("isHidden", true);
            } else {
              console.log("===================== else");
              ele.hide();
              ele.connectedEdges().forEach((edge) => edge.hide());
              ele.data("isHidden", true);
            }
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
                  const isRootNode = nodeId === rootId;
                  if (!isRootNode) return;

                  edge.show();
                  if (layoutModeRef.current === "mindmap") {
                    requestAnimationFrame(() => {
                      edge.animate({ style: { opacity: 1 }, duration: 800 });
                    });
                  }

                  next.show();
                  if (layoutModeRef.current === "mindmap") {
                    requestAnimationFrame(() => {
                      next.animate({ style: { opacity: 1 }, duration: 800 });
                    });
                  }

                  next.data("isHidden", false);
                  queue.push({ node: next, from: nodeId });
                } else {
                  const prev = source;
                  const isRootTarget = target.id() === rootId;
                  if (!isRootTarget && prev.data("isHidden")) return;

                  edge.show();
                  if (layoutModeRef.current === "mindmap") {
                    requestAnimationFrame(() => {
                      edge.animate({ style: { opacity: 1 }, duration: 800 });
                    });
                  }

                  prev.show();
                  if (layoutModeRef.current === "mindmap") {
                    requestAnimationFrame(() => {
                      prev.animate({ style: { opacity: 1 }, duration: 800 });
                    });
                  }

                  prev.data("isHidden", false);
                  queue.push({ node: prev, from: nodeId });
                }
              });
            }
          },
        },
        {
          content: "닫기",
          select: function () {},
        },
        {
          content: "정보",
          select: function (ele) {
            const connectedEdges = ele.connectedEdges();
            const connectedNodes = connectedEdges
              .connectedNodes()
              .filter((n) => n.id() !== ele.id());
            console.log(
              "연결된 노드:",
              connectedNodes.map((n) => n.data())
            );
            console.log(
              "연결된 엣지:",
              connectedEdges.map((e) => e.data())
            );
          },
        },
      ],
      openMenuEvents: "tap",
      fillColor: "#eaeaea",
      activeFillColor: "#ccc",
      activePadding: 5,
      indicatorSize: 8,
      separatorWidth: 2,
      spotlightPadding: 4,
      menuRadius: 48,
      spotlightRadius: 22,
      minSpotlightRadius: 22,
      maxSpotlightRadius: 22,
      itemColor: "#444",
      itemTextShadowColor: "transparent",
    });

    cy.add([...graphData.nodes, ...graphData.edges]);

    cy.on("tap", "edge", (evt) => {
      console.log("엣지 클릭:", evt.target.data());
    });

    cyInstanceRef.current = cy;

    if (layoutMode === "radial") applyRadialLayout();
    else if (layoutMode === "mindmap") applyMindmapLayout();
    else if (layoutMode === "dagre") applyDagreLayout();

    onReady?.(cy);
  }, [graphData]);

  const applyRadialLayout = () => {
    const cy = cyInstanceRef.current;
    cy.nodes().forEach((node) => {
      node.show();
      node.style("opacity", 1);
      node.data("isHidden", false);
    });
    cy.edges().forEach((edge) => {
      edge.show();
      edge.style("opacity", 1);
    });

    cy.layout({ name: "cose", animate: true, padding: 30 }).run();
    cy.style().selector("edge").style({ "curve-style": "straight" }).update();

    cyInstanceRef.current = cy;
    setLayoutMode("radial");
  };

  const applyDagreLayout = () => {
    const cy = cyInstanceRef.current;
    cy.nodes().forEach((node) => {
      node.show();
      node.style("opacity", 1);
      node.data("isHidden", false);
    });
    cy.edges().forEach((edge) => {
      edge.show();
      edge.style("opacity", 1);
    });

    cy.layout({
      name: "dagre", // "curve-style": "round-taxi",
      rankDir: "RL",
      nodeSep: 40,
      rankSep: 100,
      edgeSep: 20,
      padding: 20,
      animate: true,
    }).run();

    cy.style().selector("edge").style({ "curve-style": "round-taxi" }).update(); // "straight"

    cyInstanceRef.current = cy;
    setLayoutMode("dagre");
  };

  const applyMindmapLayout = () => {
    const cy = cyInstanceRef.current;
    if (!cy) return;

    cy.nodes().forEach((node) => {
      node.hide();
      node.style("opacity", 0);
      node.data("isHidden", true);
    });
    cy.edges().forEach((edge) => {
      edge.hide();
      edge.style("opacity", 0);
    });

    const roots = cy
      .nodes()
      .filter((node) => node.outgoers("edge").length === 0);
    if (roots.length === 0) {
      console.log("루트 노드를 찾을 수 없습니다.");
      return;
    }

    cy.style()
      .selector("edge")
      .style({
        "curve-style": "round-taxi",
        "taxi-direction": "horizontal",
        "taxi-turn": 20,
        "taxi-turn-min-distance": 15,
        "edge-distances": "node-position",
      })
      .update();

    const layout = cy.layout({
      name: "dagre",
      rankDir: "RL",
      nodeSep: 40,
      rankSep: 100,
      edgeSep: 20,
      padding: 20,
      animate: true,
    });

    layout.run();

    layout.on("layoutstop", () => {
      roots.forEach((root) => {
        root.show();
        root.data("isHidden", false);
        root.animate({ style: { opacity: 1 }, duration: 500 });
      });
    });

    cyInstanceRef.current = cy;
    setLayoutMode("mindmap");
  };

  return (
    <>
      <div>
        <div style={{ marginBottom: "8px" }}>
          <button onClick={applyRadialLayout}>기본 방사형 레이아웃</button>
          <button onClick={applyDagreLayout} style={{ marginLeft: "8px" }}>
            기본 dagre 레이아웃
          </button>
          <button onClick={applyMindmapLayout} style={{ marginLeft: "8px" }}>
            🧠 마인드맵 인터랙티브
          </button>
          {layoutMode}
        </div>
        <div id="cy" ref={cyRef} className={styles.cy} />
      </div>
    </>
  );
}
