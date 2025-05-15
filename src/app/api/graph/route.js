import { NextResponse } from "next/server";
import { driver, formatDataForCytoscape } from "@/lib/neo4j";

export async function GET() {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });

  try {
    const result = await session.run("MATCH (n)-[r]->(m) RETURN n, r, m");
    const data = formatDataForCytoscape(result.records);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Graph API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await session.close();
  }
}
