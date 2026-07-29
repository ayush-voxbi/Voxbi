export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { report } = req.body;

    if (!report || !report.trim()) {
      return res.status(400).json({
        error: "Report is required"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API key is not configured"
      });
    }

    const prompt = `
You are VoxBI, a business intelligence data extraction AI.

Analyze this field sales report and extract the business metrics.

Return ONLY valid JSON. Do not use markdown.

Required JSON format:
{
  "merchants_visited": 0,
  "interested": 0,
  "not_interested": 0,
  "complaints": 0,
  "complaint_reasons": [],
  "summary": ""
}

Rules:
- Extract numbers from the report based on their meaning.
- Do not invent information.
- If a value is not mentioned, use 0.
- complaint_reasons must be an array.
- summary should be a short business summary.

Field report:
${report}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" +
        encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(data);

      return res.status(500).json({
        error: "Gemini API request failed"
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({
        error: "No AI response received"
      });
    }

    const result = JSON.parse(text);

    return res.status(200).json(result);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong while analyzing the report"
    });
  }
}