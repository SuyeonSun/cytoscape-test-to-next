"use client";

import cytoscape from "cytoscape";
import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { graphDataAtom } from "@/lib/graphAtoms";
import styles from "../_components/graphViewer.module.css";

export default function GraphViewer({ onReady, onHover, onUnhover }) {
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
            label: (ele) =>
              ele.data("name") ||
              ele.data("title") ||
              ele.data("id") ||
              ele.id(),
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
          selector: "node.Actor",
          style: {
            "background-color": "#ffb74d",
            shape: "ellipse",
          },
        },
        {
          selector: "node.Director",
          style: {
            "background-color": "#f48fb1",
            shape: "ellipse",
          },
        },
        {
          selector: "node.Movie",
          style: {
            "background-color": "#81c784",
            shape: "rectangle",
          },
        },
        {
          selector: "node.hover",
          style: {
            "border-width": 3,
            "border-color": "#00BFFF",
            width: "30px",
            height: "30px",
            transform: "scale(1.1)",
            "box-shadow": "0 0 10px rgba(0, 191, 255, 0.8)",
            transition: "all 0.3s ease",
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
            "curve-style": "taxi",
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

    cy.add([...graphData.nodes, ...graphData.edges]);
    cy.layout({
      name: "cose", // 반드시 지정!
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
