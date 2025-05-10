import { NextResponse } from "next/server";
import { driver, formatDataForCytoscape } from "@/lib/neo4j";

export async function POST(req) {
  const session = driver.session({ database: process.env.NEO4J_DATABASE });

  try {
    const { query } = await req.json();
    if (!query) {
      return NextResponse.json(
        { error: "쿼리를 입력해주세요." },
        { status: 400 }
      );
    }

    const result = await session.run(query);
    const data = formatDataForCytoscape(result.records);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Query API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await session.close();
  }
}
