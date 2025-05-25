const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const OpenAI = require("openai");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/lore", async (req, res) => {
  const { pseudo = "a summoner", genre = "unknown", role = "unknown" } = req.body;

  const prompt = `
You are Lamb and Wolf from League of Legends.
Write a poetic and mysterious lore for a ${genre.toLowerCase()} player named ${pseudo}, who plays as a ${role} in the world of Runeterra.
Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style. The first sentece is always wolf saying "Tell me lamb, who is (pseudo) ? Plus another sentence giving a surname in relation with the lore. you don't need to add the description from the narrator
End with a cryptic line from Lamb that leaves a sense of mystery.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 700,
    });

    const fullLore = completion.choices[0].message.content;

    const match = fullLore.match(/Wolf:\s(.+?)([.!?])/);
    const preview = match ? `${match[1]}${match[2]}` : "The hunter says nothing...";

    res.json({ lore: fullLore, preview });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "Failed to summon Kindred's lore." });
  }
});

// 🔊 Route pour l'audio preview via ElevenLabs
app.post("/api/preview-audio", async (req, res) => {
  const { text } = req.body;

  console.log("▶️ Requested audio preview:", text);

  if (!text) {
    console.warn("⚠️ No text provided for audio.");
    return res.status(400).json({ error: "Missing preview text." });
  }

  const voiceId = "MwzcTyuTKDKHFsZnTzKu"; // Wolf's voice
  const apiKey = process.env.ELEVEN_API_KEY;

  if (!apiKey) {
    console.error("❌ ElevenLabs API key missing!");
    return res.status(500).json({ error: "Missing ElevenLabs API key." });
  }

  const options = {
    hostname: "api.elevenlabs.io",
    path: `/v1/text-to-speech/${voiceId}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
      "accept": "audio/mpeg",
    },
  };

  const body = JSON.stringify({
    text,
    model_id: "eleven_monolingual_v1"
    // ← tes réglages ElevenLabs sont appliqués automatiquement
  });

  const request = https.request(options, (response) => {
    if (response.statusCode !== 200) {
      console.error(`🟥 ElevenLabs responded with status ${response.statusCode}`);
      return res.status(500).json({ error: "ElevenLabs API failed." });
    }

    res.setHeader("Content-Type", "audio/mpeg");

    response.on("error", (e) => {
      console.error("Stream error:", e);
      res.status(500).end();
    });

    response.pipe(res);
  });

  request.on("error", (e) => {
    console.error("❌ Request to ElevenLabs failed:", e);
    res.status(500).json({ error: "Failed to generate audio." });
  });

  request.write(body);
  request.end();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
