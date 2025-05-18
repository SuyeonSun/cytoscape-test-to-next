"use client";

import { useState, useEffect } from "react";
import GraphSummary from "./_components/GraphSummary";
import GraphViewer from "./_components/GraphViewer";
import QueryForm from "./_components/QueryForm";
import { useAtom } from "jotai";
import { graphDataAtom } from "@/store/graphAtoms";

import styles from "./testPage.module.css";
import SimpleTable from "./_components/SimpleTable";
import ObjectTable from "./_components/ObjectTable";

export default function TestPage() {
  const [cy, setCy] = useState(null);
  const [graphData, setGraphData] = useAtom(graphDataAtom);
  const [rawRecords, setRawRecords] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isSimple, setIsSimple] = useState(false);

  const loadGraph = async (query = null) => {
    const res = await fetch(query ? "/api/query" : "/api/graph", {
      method: query ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      body: query ? JSON.stringify({ query }) : null,
    });
    const { data, rawRecords } = await res.json();
    setGraphData(data);
    setRawRecords(rawRecords);
    setIsSimple(isSimpleTable(rawRecords));

    cy?.elements().remove();
    // cy?.add([...data.nodes, ...data.edges]);
    // cy?.layout({ name: "cose", animate: true, padding: 30 }).run();
  };

  useEffect(() => {
    loadGraph(null); // 또는 loadGraph() 로 초기 데이터 로딩
  }, []);

  function isSimpleTable(records) {
    if (!records?.length) return true;

    return records.every((record) =>
      record._fields.every((field) => {
        // 1. Neo4j Integer 객체
        const isNeoInt =
          typeof field === "object" &&
          field !== null &&
          Object.keys(field).length === 2 &&
          typeof field.low === "number" &&
          typeof field.high === "number";

        // 2. 일반 숫자 또는 문자열
        const isPrimitive =
          typeof field === "number" || typeof field === "string";

        // 3. 단순 타입 중 하나라도 해당되면 OK
        return isNeoInt || isPrimitive;
      })
    );
  }

  return (
    <div className={styles["page-container"]}>
      <QueryForm onQuery={loadGraph} onReset={() => loadGraph(null)} />
      <div style={{ display: "flex" }}>
        <GraphViewer
          onReady={setCy}
          onHover={setHoveredNode}
          onUnhover={() => setHoveredNode(null)}
        />
        {isSimple ? (
          <SimpleTable rawRecords={rawRecords} />
        ) : (
          <ObjectTable rawRecords={rawRecords} />
        )}
      </div>
    </div>
  );
}
