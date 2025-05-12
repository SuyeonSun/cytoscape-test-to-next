"use client";

import { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import styles from "../page.module.css";

export default function TestPage() {
  const cyRef = useRef(null);
  const [cy, setCy] = useState(null);
  const [query, setQuery] = useState("");

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
      cyInstance.add([...data.nodes, ...data.edges]);
      cyInstance.layout({ name: "cose", animate: true, padding: 30 }).run();

      console.log("그래프 로드 완료:", data);
    } catch (err) {
      alert("그래프 불러오기 실패: " + err.message);
    }
  };

  useEffect(() => {
    if (!cyRef.current) return;

    const cyInstance = cytoscape({
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
      layout: {
        name: "cose", // preset
        animate: true,
        padding: 30,
      },
    });

    setCy(cyInstance);
    loadGraphData(cyInstance, "/api/graph");

    cyInstance.on("tap", "node", (evt) => {
      console.log("클릭된 노드 정보:", evt.target.data(), evt.target.classes());
    });

    cyInstance.on("tap", "edge", (evt) => {
      console.log("클릭된 edge 정보:", evt.target.data());
    });
  }, []);

  const handleQueryBtn = () => {
    const trimmed = query.trim();
    if (!trimmed) return alert("Cypher 쿼리를 입력해주세요.");
    if (!cy) return alert("그래프가 아직 준비되지 않았습니다.");
    console.log("쿼리 실행 요청:", trimmed);
    loadGraphData(cy, "/api/query", "POST", { query: trimmed });
  };

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
