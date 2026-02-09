import { NextResponse } from "next/server";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  return NextResponse.json({
    hasDbUrl: !!dbUrl,
    dbUrlStart: dbUrl ? dbUrl.substring(0, 50) + "..." : "undefined",
    nodeEnv: process.env.NODE_ENV,
  });
}
