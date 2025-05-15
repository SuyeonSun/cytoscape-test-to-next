"use client";
import { useAtomValue } from "jotai";
import { graphDataAtom } from "@/store/graphAtoms";

import styles from "./graphSummary.module.css";

export default function GraphSummary({ hoveredNode }) {
  const graph = useAtomValue(graphDataAtom);

  const labelCounts = graph.nodes.reduce((acc, node) => {
    const labels = node.data.labels || ["Unknown"];
    labels.forEach((label) => {
      acc[label] = (acc[label] || 0) + 1;
    });
    return acc;
  }, {});

  const relTypeCounts = graph.edges.reduce((acc, edge) => {
    const type = edge.data.type || "Unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  if (hoveredNode) {
    return (
      <div className={styles.summary}>
        <p className={styles["summary-title"]}>Node properties</p>
        <div className={styles.labels}>
          {hoveredNode.labels &&
            hoveredNode.labels.map((label, index) => (
              <span key={index} className={styles[label]}>
                {label}
              </span>
            ))}
        </div>
        <div className={styles["content-cotainer"]}>
          <span className={styles["content-title"]}>id: </span>
          <span>{hoveredNode.id}</span>
        </div>
        <div className={styles["content-cotainer"]}>
          <span className={styles["content-title"]}>
            {hoveredNode.name ? "name" : "title"}:
          </span>
          <span>{hoveredNode.name || hoveredNode.title}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.summary}>
      <p className={styles["summary-title"]}>Overview</p>
      <div className={styles.labels}>
        <p className={styles["content-title"]}>Node labels</p>
        <span className={styles.default}>* ({graph.nodes.length})</span>
        {Object.entries(labelCounts).map(([label, count]) => (
          <span key={label} className={styles[label]}>
            {label} ({count})
          </span>
        ))}
      </div>

      <div className={styles.relationships}>
        <p className={styles["content-title"]}>Relationship types</p>
        <span className={styles.default}>* ({graph.edges.length})</span>
        {Object.entries(relTypeCounts).map(([type, count]) => (
          <span key={type} className={styles[type]}>
            {type} ({count})
          </span>
        ))}
      </div>

      <div className={styles["summary-footer"]}>
        <p>
          Displaying {graph.nodes.length} nodes, {graph.edges.length}
          relationships.
        </p>
      </div>
    </div>
  );
}
