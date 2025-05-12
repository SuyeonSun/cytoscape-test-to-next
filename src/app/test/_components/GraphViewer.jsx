"use client";

import cytoscape from "cytoscape";
import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { graphDataAtom } from "@/lib/graphAtoms";
import styles from "../_components/graphViewer.module.css";

export default function GraphViewer({ onReady }) {
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
          selector: "node.Person",
          style: {
            "background-color": "#FEE135",
            shape: "ellipse",
          },
        },
        {
          selector: "node.Director",
          style: {
            "background-color": "#E75480",
            shape: "ellipse",
          },
        },
        {
          selector: "node.Movie",
          style: {
            "background-color": "#4caf50",
            shape: "rectangle",
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

    onReady?.(cy);
  }, [graphData]);

  return <div id="cy" ref={cyRef} className={styles.cy} />;
}
