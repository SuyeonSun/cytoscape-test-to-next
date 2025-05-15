import React from "react";
import { parseNeo4jInt } from "@/utils/neo4jUtils";

function simplifyField(field) {
  if (!field || typeof field !== "object") return field;

  // Neo4j Integer 처리
  if (typeof field.low === "number" && typeof field.high === "number") {
    return parseNeo4jInt(field);
  }

  // Node or Relationship
  const simplified = { ...field };

  if (field.identity) {
    simplified.identity = parseNeo4jInt(field.identity);
  }

  if (field.properties) {
    simplified.properties = { ...field.properties };
    Object.entries(field.properties).forEach(([key, value]) => {
      simplified.properties[key] = parseNeo4jInt(value);
    });
  }

  if (field.start) simplified.start = parseNeo4jInt(field.start);
  if (field.end) simplified.end = parseNeo4jInt(field.end);

  return simplified;
}

export default function ObjectTable({ rawRecords }) {
  if (!rawRecords || rawRecords.length === 0)
    return <div>데이터가 없습니다.</div>;

  const columns = rawRecords[0].keys;

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        border="1"
        cellPadding={6}
        style={{ borderCollapse: "collapse", minWidth: "100%" }}
      >
        <thead>
          <tr>
            {columns.map((key) => (
              <th key={key}>{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rawRecords.map((record, rowIndex) => (
            <tr key={rowIndex}>
              {record._fields.map((field, colIndex) => (
                <td key={colIndex}>
                  <pre style={{ fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(simplifyField(field), null, 2)}
                  </pre>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
