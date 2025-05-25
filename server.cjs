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
Write a poetic and mysterious lore for a ${genre.toLowerCase()} player named ${pseudo}, who plays as a ${role} in the world of Runeterra.
Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying "Tell me lamb, who is ${pseudo}?" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the rôle itself to create the lore. don' t add narrator, when Wolf end his sentence, this is lamb's turn, i don't want to see any ""Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night." I don' want this kind of description
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

app.post("/api/preview-audio", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Missing preview text." });
  }

  const voiceId = "MwzcTyuTKDKHFsZnTzKu"; // Wolf
  const apiKey = process.env.ELEVEN_API_KEY;

  if (!apiKey) {
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
    model_id: "eleven_english_v2",
    voice_settings: {
      stability: 0.3,
      similarity_boost: 1.0,
      style: 0.5
    }
  });

  const request = https.request(options, (response) => {
    if (response.statusCode !== 200) {
      console.error(`🟥 ElevenLabs responded with ${response.statusCode}`);
      return res.status(500).json({ error: "ElevenLabs API failed." });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    response.pipe(res);
  });

  request.on("error", (e) => {
    console.error("❌ ElevenLabs request failed:", e);
    res.status(500).json({ error: "Failed to generate audio." });
  });

  request.write(body);
  request.end();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
