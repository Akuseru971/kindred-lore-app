require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
const https = require("https");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 10000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(bodyParser.json());

// Lore Generation
app.post("/api/lore", async (req, res) => {
  const { pseudo, genre = "man", role = "mid" } = req.body;

  if (!pseudo) {
    return res.status(400).json({ error: "Missing pseudo" });
  }

  const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying \"Tell me lamb, who is ${pseudo}?\" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the role itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like \"Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night.\"
End with a cryptic line from Lamb that leaves a sense of mystery.
Limit the dialogue to 12 lines maximum.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    });

    const lore = completion.choices[0]?.message?.content;
    res.json({ lore });
  } catch (err) {
    console.error("Error generating lore:", err);
    res.status(500).json({ error: "Failed to summon Kindred." });
  }
});

// Audio Preview Generation
app.post("/api/preview", async (req, res) => {
  const { previewText } = req.body;
  if (!previewText) {
    return res.status(400).json({ error: "Missing previewText" });
  }

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/MwzcTyuTKDKHFsZnTzKu/stream", {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: previewText,
        model_id: "eleven_english_v2",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 1.0,
          style: 0.5,
        },
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate voice preview");
      return res.status(500).json({ error: "Wolf voice could not be summoned" });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    response.body.pipe(res);
  } catch (err) {
    console.error("Voice preview error:", err);
    res.status(500).json({ error: "Wolf voice could not be summoned" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
