"use client";
import { useAtomValue } from "jotai";
import { graphDataAtom } from "@/lib/graphAtoms";

export default function GraphSummary({ hoveredNode }) {
  const graph = useAtomValue(graphDataAtom);

  const labelCounts = graph.nodes.reduce((acc, node) => {
    const labels = node.data.labels || ["Unknown"];
    labels.forEach((label) => {
      acc[label] = (acc[label] || 0) + 1;
    });
    return acc;
  }, {});

  // 관계 타입별 카운트
  const relTypeCounts = graph.edges.reduce((acc, edge) => {
    const type = edge.data.type || "Unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  if (hoveredNode) {
    return (
      <div>
        <h2>Node Info</h2>
        <p>
          <strong>id:</strong> {hoveredNode.id}
        </p>
        <p>
          <strong>{hoveredNode.name ? "name" : "title"}:</strong>
          {hoveredNode.name || hoveredNode.title}
        </p>
        <p>
          <strong>labels:</strong> {(hoveredNode.labels || []).join(", ")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Overview</h2>

      <div>
        <h3>Node labels</h3>
        <div>
          <span>* ({graph.nodes.length})</span>
          {Object.entries(labelCounts).map(([label, count]) => (
            <span key={label}>
              {label} ({count})
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3>Relationship types</h3>
        <div>
          <span>* ({graph.edges.length})</span>
          {Object.entries(relTypeCounts).map(([type, count]) => (
            <span key={type}>
              {type} ({count})
            </span>
          ))}
        </div>
      </div>

      <p>
        Displaying {graph.nodes.length} nodes, {graph.edges.length}{" "}
        relationships.
      </p>
    </div>
  );
}
