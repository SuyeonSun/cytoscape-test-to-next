import React from "react";
import { parseNeo4jInt } from "@/utils/neo4jUtils";

function parseNeo4jValue(value) {
  if (
    value &&
    typeof value === "object" &&
    "low" in value &&
    "high" in value &&
    typeof value.low === "number" &&
    typeof value.high === "number"
  ) {
    return parseNeo4jInt(value);
  }

  if (Array.isArray(value)) {
    return value.map(parseNeo4jValue);
  }

  if (value && typeof value === "object") {
    const newObj = {};
    for (const [key, val] of Object.entries(value)) {
      newObj[key] = parseNeo4jValue(val);
    }
    return newObj;
  }

  return value;
}

function simplifyField(field) {
  return parseNeo4jValue(field);
}

export default function ObjectTable({ rawRecords }) {
  console.log("======", rawRecords);
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
