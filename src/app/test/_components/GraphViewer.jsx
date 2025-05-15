"use client";

import cytoscape from "cytoscape";
import cxtmenu from "@/lib/cytoscapeWithCxtmenu";

import { useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { graphDataAtom } from "@/lib/graphAtoms";
import styles from "../_components/graphViewer.module.css";

export default function GraphViewer({ onReady, onHover, onUnhover }) {
  if (!cytoscape.prototype.hasOwnProperty("cxtmenu")) {
    cytoscape.use(cxtmenu);
  }
  const cyRef = useRef(null);
  const [graphData] = useAtom(graphDataAtom);

  function parseNeo4jInt(n) {
    if (typeof n === "number") return n;
    if (n && typeof n.low === "number" && typeof n.high === "number") {
      const isNegative = n.high < 0;
      const lowUnsigned = n.low >>> 0;
      const highAbs = isNegative ? ~n.high + 1 : n.high;
      // 64비트 정수 계산
      const result = highAbs * 2 ** 32 + lowUnsigned;
      // 음수 보정
      return isNegative ? -result : result;
    }
    return 0;
  }

  function formatExactNumber(num) {
    const parts = num.toString().split(".");
    const integer = Number(parts[0]).toLocaleString(); // 콤마 처리
    const decimal = parts[1] ? "." + parts[1] : "";
    return integer + decimal;
  }

  function formatAmountWithMajorUnits(amount) {
    if (amount === 0) return "0원";

    const units = [
      { label: "조", value: 1_0000_0000_0000 },
      { label: "억", value: 1_0000_0000 },
      { label: "만", value: 1_0000 },
    ];
    const result = [];
    const [intStr, decimalStr = ""] = amount.toString().split("."); // 정수, 소수 분리
    let remaining = BigInt(intStr); // 2345678901234567890n

    for (const { label, value } of units) {
      const unitVal = remaining / BigInt(value);
      if (unitVal > 0n) {
        result.push(`${unitVal.toString()}${label}`);
      }
      remaining %= BigInt(value);
    }

    const lastInt = remaining.toString(); // 나머지 원 단위
    const decimal = decimalStr ? `.${decimalStr}` : "";

    if (lastInt === "0" && decimal === "") {
      // 0.0원
    } else if (lastInt === "0" && decimal !== "") {
      // 0.123원
      result.push(`${decimal}`);
    } else {
      // 123.123원
      result.push(`${lastInt}${decimal}`);
    }

    return result.join(" ") + "원";
  }

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: "node",
          style: {
            label: (ele) => ele.data("name"),
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
          selector: "edge",
          style: {
            label: (ele) => {
              const type = ele.data("type") || "";
              const amount = parseNeo4jInt(ele.data("amount"));
              return `${type}\n${
                ele.data("role") === "negative" ? "(-)" : "(+)"
              } ${formatAmountWithMajorUnits(amount)}`;
            },
            width: 0.4,
            "text-wrap": "wrap",
            "line-color": "#ccc",
            "target-arrow-color": "#ccc",
            "target-arrow-shape": "triangle",
            "arrow-scale": "0.4",
            "curve-style": "straight",
            "font-size": "4px",
            // color: "#d62828",
            color: (ele) => {
              return ele.data("role") === "negative" ? "#d62828" : "#2a9d8f";
            },
            "edge-text-rotation": "autorotate",
            "text-background-shape": "rectangle",
            "text-background-opacity": 1,
            "text-background-color": "#fff",
          },
        },
      ],
    });

    // cxtmenu
    cy.cxtmenu({
      selector: "node",
      commands: [
        {
          content: "숨김",
          select: function (ele) {
            ele.hide();
            ele.connectedEdges().forEach((edge) => edge.hide());
            // ele.connectedEdges().hide();
            ele.data("isHidden", true); // 선택적으로 hidden 상태 표시
          },
        },
        {
          content: "확장",
          select: function (ele) {
            const visited = new Set();
            const queue = [{ node: ele, from: null }];
            const rootId = ele.id();

            while (queue.length > 0) {
              const { node, from } = queue.shift();
              const nodeId = node.id();
              if (visited.has(nodeId)) continue;
              visited.add(nodeId);

              const edges = node.connectedEdges();
              edges.forEach((edge) => {
                const source = edge.source();
                const target = edge.target();
                const isOutgoing = source.id() === nodeId;

                if (isOutgoing) {
                  const next = target;
                  const isRootNode = nodeId === rootId; // 지금 탐색 중인 노드가 클릭한 노드인가?

                  if (!isRootNode) {
                    console.log(
                      `❌ ${next.id()}는 root의 직접 자식이 아니므로 skip`
                    );
                    return;
                  }
                  edge.show();
                  next.show();
                  next.data("isHidden", false);
                  queue.push({ node: next, from: nodeId });
                } else {
                  const prev = source;
                  const isRootTarget = target.id() === rootId;

                  if (!isRootTarget && prev.data("isHidden")) {
                    console.log(
                      `❌ ${prev.id()}는 root의 부모지만 root의 직접 연결 아니므로 skip`
                    );
                    return;
                  }

                  edge.show();
                  prev.show();
                  prev.data("isHidden", false);
                  queue.push({ node: prev, from: nodeId });
                }
              });
            }
          },
        },
        {
          content: "닫기",
          select: function () {
            // 메뉴 닫기 (기본 동작)
          },
        },
        {
          content: "정보",
          select: function (ele) {
            const connectedEdges = ele.connectedEdges();
            const connectedNodes = connectedEdges
              .connectedNodes()
              .filter((n) => n.id() !== ele.id());

            const nodeDetails = connectedNodes.map((n) => n.data());
            const edgeDetails = connectedEdges.map((e) => e.data());

            console.log("연결된 노드:", nodeDetails);
            console.log("연결된 엣지:", edgeDetails);
          },
        },
      ],
      openMenuEvents: "tap", // 좌클릭 대응
      fillColor: "#eaeaea", // 배경 회색
      activeFillColor: "#ccc", // 선택 시 하이라이트
      activePadding: 5,
      indicatorSize: 8,
      separatorWidth: 2,
      spotlightPadding: 4,
      menuRadius: 48,
      spotlightRadius: 22, // 중앙 원 크기
      minSpotlightRadius: 22,
      maxSpotlightRadius: 22,
      itemColor: "#444", // 아이콘 색상
      itemTextShadowColor: "transparent",
    });

    cy.add([...graphData.nodes, ...graphData.edges]);
    cy.layout({
      name: "cose",
      animate: true,
      padding: 30,
    }).run();

    // cy.on("tap", "node", (evt) => {
    //   console.log("노드 클릭:", evt.target.data());
    // });

    cy.on("tap", "edge", (evt) => {
      console.log("엣지 클릭:", evt.target.data());
    });

    // cy.on("mouseover", "node", (evt) => {
    //   const node = evt.target;
    //   node.addClass("hover");
    //   onHover?.(evt.target.data());
    // });

    // cy.on("mouseout", "node", (evt) => {
    //   const node = evt.target;
    //   node.removeClass("hover");
    //   onUnhover?.();
    // });

    onReady?.(cy);
  }, [graphData]);

  return <div id="cy" ref={cyRef} className={styles.cy} />;
}
