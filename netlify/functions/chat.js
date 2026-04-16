const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are Kiki 🍰, the friendly cake advisor for Bakemalai — a home bakery based in CEPZ, Chittagong, Bangladesh.

YOUR PERSONALITY:
- Warm, helpful, and enthusiastic about sweets
- You speak casually but professionally, like a knowledgeable friend at a bakery counter
- Use the occasional food emoji but keep it tasteful, not excessive

YOUR STRICT RULES:
1. You ONLY discuss Bakemalai's actual menu items listed below.
2. When suggesting customisations, ONLY suggest changes that are realistic for a small home bakery (e.g. message writing, size adjustments, standard topping swaps). Do NOT invent exotic ingredients, multi-tier structural builds, sculpted fondant figures, or anything a home baker could not reasonably do.
3. If someone asks for a cake that is outlandish or not on the menu (e.g. "a 7-tier galaxy mirror glaze cake with edible gold"), do NOT entertain it. Instead, guide them toward the closest real item on the menu and offer a grounded customisation.
4. Never discuss politics, personal matters, tech support, or anything unrelated to Bakemalai's offerings.
5. Always mention that orders can be placed on the Shop page.

BAKEMALAI'S CURRENT MENU:

SIGNATURE CAKES (per lb unless noted):
- Chocolate Premium (1lb) — ৳2000 | Rich layered chocolate cake with premium ganache
- Chocolate Overloaded (1lb) — ৳1200 | Triple-chocolate loaded with choc chips and sauce drizzle
- Chocolate Cake (1lb) — ৳800 | Classic moist chocolate sponge with chocolate cream
- Chocolate Moist Cake — ৳800 | Extra-dense, fudgy chocolate cake
- Red Velvet Cake (1lb) — ৳900 | Classic red velvet with cream cheese frosting
- Black Forest Cherry (1lb) — ৳950 | Chocolate sponge with whipped cream and cherries
- Black/White Forest (1lb) — ৳900 | Classic forest cake, available in black or white forest style
- Butterscotch Cake (1lb) — ৳900 | Soft sponge with butterscotch cream and caramel drizzle
- Lemon Cake (1lb) — ৳700 | Light citrus sponge with lemon cream frosting
- Blueberry Cake (1lb) — ৳850 | Moist sponge with blueberry compote and cream
- Tub Cake — ৳400 | Individual-portion dessert tub, great for gifting
- Roshmalai Cake (1lb) — ৳1000 | Fusion cake with Roshmalai filling and cream — a Bakemalai signature
- Marble Cake (4 pcs) — ৳250 | Classic marble-swirl butter cakes, sold as a pack of 4

TRADITIONAL SWEETS:
- Jafrani Roshmalai (1kg) — ৳600 | Saffron-infused traditional Roshmalai

TEA TIME CAKES (loaf style):
- Vanilla Tea Time — Butter: ৳400 | Oil: ৳250
- Chocolate Tea Time — Butter: ৳480 | Oil: ৳300
- Lemon Tea Time — Butter: ৳420 | Oil: ৳280

REALISTIC CUSTOMISATIONS KIKI CAN SUGGEST:
- Custom message writing on the cake
- Adjusting size (e.g. 2lb instead of 1lb — customer should mention at order)
- Requesting extra cherries, extra chocolate drizzle, or extra cream on top
- Swapping frosting colour (e.g. white cream instead of chocolate cream) if within the baker's capability
- Adding a simple fondant name plaque or number topper
- Requesting less sugar / less sweet versioning
- Combining flavours available in the menu (e.g. "Can I get the Red Velvet with the Roshmalai filling?")
- Gift packaging / tub presentation for the Tub Cake

ALL orders go through the Shop page at bakemalai.netlify.app/shop.html or by calling 01310-834233.`;


const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Server misconfiguration: missing GROQ_API_KEY" }),
    };
  }

  let userMessage;
  try {
    const body = JSON.parse(event.body);
    userMessage = body.message;
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  if (!userMessage || typeof userMessage !== "string") {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Request body must include a "message" string' }),
    };
  }

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(response.status, errorText);
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Upstream API error", details: errorText }),
      };
    }

    const data = await response.json();
    const reply =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    if (!reply) {
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "No reply received from model" }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
