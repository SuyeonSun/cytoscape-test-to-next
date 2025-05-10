"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import styles from "../page.module.css";

export default function TestPage() {
  const cyRef = useRef(null);
  const [cy, setCy] = useState(null);
  const [query, setQuery] = useState("");

  // ✅ 그래프 데이터 불러오기 함수
  const loadGraphData = async (
    cyInstance,
    url,
    method = "GET",
    body = null
  ) => {
    try {
      const fetchOptions = {
        method,
        headers: { "Content-Type": "application/json" },
      };
      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      if (!response.ok) throw new Error(`서버 오류: ${response.statusText}`);

      const data = await response.json();
      cyInstance.elements().remove();
      cyInstance.add([...data.nodes, ...data.edges]); // ✅ 배열로 넘기기
      cyInstance.layout({ name: "cose", animate: true, padding: 30 }).run();

      console.log("그래프 로드 완료:", data);
    } catch (err) {
      alert("그래프 불러오기 실패: " + err.message);
    }
  };

  // ✅ 최초 한 번만 cytoscape 초기화
  useEffect(() => {
    if (!cyRef.current) return;

    const cyInstance = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: "node",
          style: {
            "background-color": "#666",
            label: (ele) => ele.data("name") || ele.data("id") || ele.id(),
            "font-size": "10px",
            color: "#333",
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": "5px",
          },
        },
        {
          selector: "edge",
          style: {
            width: 2,
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: (ele) => ele.data("type") || "",
            "font-size": "8px",
            color: "#555",
            "edge-text-rotation": "autorotate",
          },
        },
      ],
      layout: {
        name: "cose",
        animate: true,
        padding: 30,
      },
    });

    setCy(cyInstance); // 상태로 저장
    loadGraphData(cyInstance, "/api/graph");

    // 노드 클릭 이벤트 예시 (선택)
    cyInstance.on("tap", "node", (evt) => {
      console.log("클릭된 노드 정보:", evt.target.data());
    });
  }, []);

  // ✅ 쿼리 실행 버튼
  const handleQueryBtn = () => {
    const trimmed = query.trim();
    if (!trimmed) return alert("Cypher 쿼리를 입력해주세요.");
    if (!cy) return alert("그래프가 아직 준비되지 않았습니다.");
    console.log("쿼리 실행 요청:", trimmed);
    loadGraphData(cy, "/api/query", "POST", { query: trimmed });
  };

  // ✅ 초기 그래프 보기 버튼
  const handleResetBtn = () => {
    if (!cy) return alert("그래프가 아직 준비되지 않았습니다.");
    setQuery("");
    loadGraphData(cy, "/api/graph");
  };

  return (
    <div>
      <h1>Neo4j Data Visualization</h1>
      <div className={styles.controls}>
        <textarea
          rows="3"
          placeholder="Cypher 쿼리를 입력하세요"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleQueryBtn}>쿼리 실행</button>
        <button onClick={handleResetBtn}>초기 그래프 보기</button>
      </div>
      <div id="cy" ref={cyRef} className={styles.cy}></div>
    </div>
  );
}
