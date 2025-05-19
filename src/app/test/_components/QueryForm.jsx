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
    <div style={{ marginBottom: "16px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <textarea
          rows="3"
          placeholder="Cypher 쿼리를 입력하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1,
            resize: "none",
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <button
            onClick={handleQueryBtn}
            style={{
              padding: "6px 12px",
              backgroundColor: "#1976d2",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            쿼리 실행
          </button>
          <button
            onClick={() => {
              onReset();
              setQuery("");
            }}
            style={{
              padding: "6px 12px",
              backgroundColor: "#e0e0e0",
              color: "#333",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            초기 그래프
          </button>
        </div>
      </div>

      <div
        style={{
          marginTop: "12px",
          padding: "10px",
          backgroundColor: "#f9f9f9",
          border: "1px solid #ddd",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#555",
          lineHeight: "1.6",
        }}
      >
        <p style={{ margin: "12px 0px" }}>
          <code>
            // 전체 속성 조회
            <br />
            MATCH (n)-[r]-&gt;(m) RETURN n, r, m
          </code>
        </p>
        <p style={{ margin: "12px 0px" }}>
          <code>
            // 비용 흐름만 조회
            <br />
            {`MATCH (n:Metric)-[r:contrib_to {role: "negative"}]->(m:Metric)
            RETURN n, r, m`}
          </code>
        </p>
        <p style={{ margin: "12px 0px" }}>
          <code>
            // level2 이하만 필터링
            <br />
            {`MATCH (n:Metric)-[r:contrib_to]->(m:Metric)
            WHERE n.level <= 2 AND m.level <= 2
            RETURN n, r, m`}
          </code>
        </p>
        <p style={{ margin: "12px 0px" }}>
          <code>
            // amount 속성의 최소값, 최대값, 평균값
            <br />
            MATCH (n:Metric) RETURN MIN(n.amount) AS minAmount, MAX(n.amount) AS
            maxAmount, AVG(n.amount) AS avgAmount
          </code>
        </p>
      </div>
    </div>
  );
}
