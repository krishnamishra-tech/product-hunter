module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { niche } = req.body;
    if (!niche || !niche.trim()) {
      return res.status(400).json({ error: "Niche/keyword required" });
    }

    const systemPrompt = `You are a product research assistant for a D2C ecommerce seller in India.
Given a niche/keyword, use web search to find 6-8 currently trending or best-selling products in that niche relevant to the Indian market in 2026.

Respond with ONLY a raw JSON array, no markdown fences, no preamble, no explanation. Each item must have exactly these fields:
- "name": product name (string)
- "reason": one short sentence on why it's trending right now (string)
- "price_band": approximate price range in INR, e.g. "₹300–₹800" (string)
- "content_angle": one short content/marketing idea to sell it on social media (string)
- "source_note": brief note on where this trend signal came from, e.g. "Amazon India bestseller lists" (string)

Return ONLY the JSON array.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          { role: "user", content: `Niche/keyword: ${niche}` },
        ],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return res.status(500).json({ error: "Claude API call failed" });
    }

    const data = await response.json();

    const fullText = data.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    const cleaned = fullText.replace(/```json|```/g, "").trim();

    let products;
    try {
      products = JSON.parse(cleaned);
    } catch (e) {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) products = JSON.parse(match[0]);
      else throw e;
    }

    return res.status(200).json({ products, niche });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Could not fetch products. Try again." });
  }
};
