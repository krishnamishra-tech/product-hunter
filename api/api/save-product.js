const { createClient } = require("@supabase/supabase-js");

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { niche, product } = req.body;
    const { error } = await supabaseAdmin.from("product_finds").insert({
      niche,
      name: product.name,
      reason: product.reason,
      price_band: product.price_band,
      content_angle: product.content_angle,
      source_note: product.source_note,
    });
    if (error) throw error;
    return res.status(200).json({ saved: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Could not save product" });
  }
};
