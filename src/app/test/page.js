"use client";

import { useState, useEffect } from "react";
import GraphSummary from "./_components/GraphSummary";
import GraphViewer from "./_components/GraphViewer";
import QueryForm from "./_components/QueryForm";
import { useAtom } from "jotai";
import { graphDataAtom } from "@/lib/graphAtoms";

import styles from "./testPage.module.css";

export default function TestPage() {
  const [cy, setCy] = useState(null);
  const [graphData, setGraphData] = useAtom(graphDataAtom);
  const [hoveredNode, setHoveredNode] = useState(null);

  const loadGraph = async (query = null) => {
    const res = await fetch(query ? "/api/query" : "/api/graph", {
      method: query ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: query ? JSON.stringify({ query }) : null,
    });
    const data = await res.json();
    setGraphData(data);
    cy?.elements().remove();
    cy?.add([...data.nodes, ...data.edges]);
    // cy?.layout({ name: "cose", animate: true, padding: 30 }).run();
  };

  useEffect(() => {
    loadGraph(null); // 또는 loadGraph() 로 초기 데이터 로딩
  }, []);

  return (
    <div className={styles["page-container"]}>
      <QueryForm onQuery={loadGraph} onReset={() => loadGraph(null)} />
      <div style={{ display: "flex" }}>
        <GraphViewer
          onReady={setCy}
          onHover={setHoveredNode}
          onUnhover={() => setHoveredNode(null)}
        />
        {/* <GraphSummary hoveredNode={hoveredNode} /> */}
      </div>
    </div>
  );
}
