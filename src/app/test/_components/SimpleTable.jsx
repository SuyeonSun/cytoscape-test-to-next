"use client";

import React from "react";
import { parseNeo4jInt } from "@/utils/neo4jUtils";

export default function SimpleTable({ rawRecords }) {
  if (!rawRecords || rawRecords.length === 0) {
    return <p>표시할 데이터가 없습니다.</p>;
  }

  const headers = rawRecords[0].keys;

  return (
    <div
      style={{
        overflowX: "auto",
        width: "100%",
        overflowY: "auto",
        maxHeight: "500px",
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
            {headers.map((key) => (
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
          {rawRecords.map((record, rowIdx) => (
            <tr key={rowIdx}>
              {headers.map((key) => {
                const value = record._fields?.[record._fieldLookup?.[key]];
                return (
                  <td
                    key={key}
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "8px",
                      fontSize: "13px",
                    }}
                  >
                    {typeof value === "string" ? value : parseNeo4jInt(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
