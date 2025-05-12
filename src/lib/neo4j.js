import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

const formatDataForCytoscape = (records) => {
  const nodes = new Map();
  const edges = new Map();

  records.forEach((record) => {
    record.forEach((value) => {
      if (value && value.identity) {
        const id = value.identity.toString(); // TODO: identity는 Integer 타입인데 toString()을 해도 되는가?
        const props = value.properties;
        // node인 경우
        if (value.labels) {
          // ============= 원래 코드 =============
          // if (!nodes.has(id)) {
          //   nodes.set(id, {
          //     data: { id, labels: value.labels, ...props },
          //   });
          // }
          // ============= 수정된 코드 =============
          const existing = nodes.get(id)?.data || {};
          nodes.set(id, {
            data: {
              ...existing,
              id,
              labels: value.labels,
              ...props,
            },
            classes: value.labels.join(" "), // node 색상 변경을 위한 클래스 문자열 추가
          });
        } else if (value.type) {
          if (!edges.has(id)) {
            edges.set(id, {
              data: {
                id: "edge_" + id,
                source: value.start.toString(),
                target: value.end.toString(),
                type: value.type,
                ...props,
              },
            });

            if (!nodes.has(value.start.toString())) {
              nodes.set(value.start.toString(), {
                data: { id: value.start.toString() },
              });
            }
            if (!nodes.has(value.end.toString())) {
              nodes.set(value.end.toString(), {
                data: { id: value.end.toString() },
              });
            }
          }
        }
      }
    });
  });

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
};

export { driver, formatDataForCytoscape };
