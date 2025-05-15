"use client";

import { useState } from "react";

export default function QueryForm({ onQuery, onReset }) {
  const [query, setQuery] = useState("");

  const handleQueryBtn = () => {
    const trimmed = query.trim();
    if (!trimmed) return alert("Cypher 쿼리를 입력해주세요.");
    onQuery(trimmed);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <textarea
          rows="3"
          placeholder="Cypher 쿼리를 입력하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleQueryBtn}>쿼리 실행</button>
        <button onClick={onReset}>초기 그래프 보기</button>
      </div>
      <div style={{ fontSize: "10px", marginBottom: "10px" }}>
        <p>{`MATCH (n)-[r]->(m) RETURN n, r, m`}</p>
        <p>
          MATCH (n:Metric) RETURN MIN(n.amount) AS minAmount, MAX(n.amount) AS
          maxAmount, AVG(n.amount) AS avgAmount
        </p>
      </div>
    </>
  );
}
