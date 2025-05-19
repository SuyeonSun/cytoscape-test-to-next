"use client";

import React, { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import expandCollapse from "cytoscape-expand-collapse";

expandCollapse(cytoscape);

const ExpandableGraph = () => {
  const cyRef = useRef(null);

  useEffect(() => {
    const cy = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "#29b6f6",
            "text-valign": "center",
            "text-halign": "center",
            shape: "ellipse",
          },
        },
        {
          selector: ":parent",
          style: {
            "background-opacity": 0.2,
            "border-color": "#444",
            "border-width": 2,
            padding: 10,
          },
        },
      ],
      elements: [
        { data: { id: "a", label: "Group A" } },
        { data: { id: "b", label: "Node B", parent: "a" } },
        { data: { id: "c", label: "Node C", parent: "a" } },
        { data: { id: "d", label: "Node D" } },
        { data: { id: "e", source: "b", target: "d" } },
      ],
      layout: { name: "breadthfirst", animate: true },
    });

    const api = cy.expandCollapse({
      layoutBy: { name: "breadthfirst", animate: true },
      animate: true,
      undoable: false,
      cueEnabled: true, // 데모에서처럼 아이콘 자동 생성
    });

    // 데모처럼 클릭으로 접고 펼치기
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      if (api.isCollapsible(node)) {
        api.collapse(node);
      } else if (api.isExpandable(node)) {
        api.expand(node);
      }
    });
  }, []);

  return <div ref={cyRef} style={{ width: "100%", height: "600px" }} />;
};

export default ExpandableGraph;
