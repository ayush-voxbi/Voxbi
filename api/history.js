import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const databaseUrl = process.env.POSTGRES_URL_NON_POOLING;

    if (!databaseUrl) {
      return res.status(500).json({
        error: "Database connection is not configured"
      });
    }

    const sql = neon(databaseUrl);

    const reports = await sql`
      SELECT
        id,
        report_text,
        merchants_visited,
        interested,
        not_interested,
        complaints,
        complaint_reasons,
        summary,
        created_at
      FROM reports
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return res.status(200).json({
      reports
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Could not load report history"
    });
  }
}