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

// 🔮 ROUTE DE GÉNÉRATION DU LORE
app.post("/api/lore", async (req, res) => {
  const { pseudo = "a summoner", genre = "unknown", role = "unknown" } = req.body;

  const prompt = `
You are Lamb and Wolf from League of Legends.
Write a poetic and mysterious lore for a ${genre.toLowerCase()} player named ${pseudo}, who plays as a ${role} in the world of Runeterra. Even if it's a man or woman, it can be a creature too, you decide, higlight the story with other existing characters in the lore. the first sentence has to start always by "Tell me Lamb, who is (pseudo), and a little sentence to tease the story of the character 
Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style. It needs to last a around 1 min so adapt the speech. It is a conversation so don't put dialogue description beteween each line
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

    // 🔎 Extraire la première phrase dite par Wolf
    const match = fullLore.match(/Wolf:\s(.+?)([.!?])/);
    const preview = match ? `Wolf: ${match[1]}${match[2]}` : "Wolf remains silent...";

    res.json({ lore: fullLore, preview });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "Failed to summon Kindred's lore." });
  }
});

// 🔊 ROUTE AUDIO POUR LA PHRASE DE WOLF
app.post("/api/preview-audio", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Missing preview text." });
  }

  const voiceId = "MwzcTyuTKDKHFsZnTzKu"; // Wolf's voice
  const apiKey = process.env.ELEVEN_API_KEY;

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
    model_id: "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.6,
      similarity_boost: 0.8,
    },
  });

  const request = https.request(options, (response) => {
    res.setHeader("Content-Type", "audio/mpeg");

    response.on("error", (e) => {
      console.error("Stream error:", e);
      res.status(500).end();
    });

    response.pipe(res);
  });

  request.on("error", (e) => {
    console.error("Request error:", e);
    res.status(500).json({ error: "Failed to generate audio." });
  });

  request.write(body);
  request.end();
});

// 🚀 SERVER EN LIGNE
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
