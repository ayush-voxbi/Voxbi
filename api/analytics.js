import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const databaseUrl = process.env.POSTGRES_URL_NON_POOLING;

    if (!databaseUrl) {
      return res.status(500).json({
        error: "Database connection is not configured"
      });
    }

    const sql = neon(databaseUrl);

    const result = await sql`
      SELECT
        COALESCE(SUM(merchants_visited), 0) AS total_merchants,
        COALESCE(SUM(interested), 0) AS total_interested,
        COALESCE(SUM(not_interested), 0) AS total_not_interested,
        COALESCE(SUM(complaints), 0) AS total_complaints,
        COUNT(*) AS total_reports
      FROM reports
    `;

    const stats = result[0];

    const totalMerchants = Number(stats.total_merchants);
    const totalInterested = Number(stats.total_interested);

    const interestRate =
      totalMerchants > 0
        ? Number(((totalInterested / totalMerchants) * 100).toFixed(1))
        : 0;

    return res.status(200).json({
      total_reports: Number(stats.total_reports),
      total_merchants: totalMerchants,
      total_interested: totalInterested,
      total_not_interested: Number(stats.total_not_interested),
      total_complaints: Number(stats.total_complaints),
      interest_rate: interestRate
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Could not load analytics"
    });
  }
}