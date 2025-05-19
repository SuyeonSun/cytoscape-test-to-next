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
  if (!rawRecords || rawRecords.length === 0)
    return <p>표시할 데이터가 없습니다.</p>;

  const columns = rawRecords[0].keys;

  return (
    <div
      style={{
        overflowX: "auto",
        width: "100%",
        overflowY: "auto",
        maxHeight: "600px",
        marginTop: "45px",
      }}
    >
      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          fontFamily: "monospace",
          fontSize: "14px",
        }}
      >
        <thead>
          <tr>
            {columns.map((key) => (
              <th
                key={key}
                style={{
                  borderBottom: "2px solid #ddd",
                  textAlign: "left",
                  padding: "8px",
                  background: "#f9f9f9",
                }}
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rawRecords.map((record, rowIndex) => (
            <tr key={rowIndex}>
              {record._fields.map((field, colIndex) => (
                <td
                  key={colIndex}
                  style={{
                    borderBottom: "1px solid #eee",
                    padding: "8px",
                    fontSize: "13px",
                    verticalAlign: "top",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
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
