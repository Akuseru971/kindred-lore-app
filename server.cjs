const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const https = require("https");
const { OpenAI } = require("openai");
const fs = require("fs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/lore", async (req, res) => {
  const { pseudo, genre = "Unknown", role = "Unknown" } = req.body;

  if (!pseudo || !genre || !role) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying "Tell me lamb, who is ${pseudo}?" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the rôle itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like "Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night."
End with a cryptic line from Lamb that leaves a sense of mystery.
The response must contain 12 replies max.
The lore is for a ${genre.toLowerCase()} player named ${pseudo}, who plays as a ${role} in the world of Runeterra.`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.8,
    });

    const lore = completion.choices[0]?.message?.content || "Kindred remained silent.";
    res.json({ lore });
  } catch (error) {
    console.error("OpenAI Error:", error.message);
    res.status(500).json({ error: "Failed to summon Kindred." });
  }
});

app.post("/api/preview", async (req, res) => {
  const { line } = req.body;
  if (!line) return res.status(400).json({ error: "No line provided." });

  const options = {
    hostname: "api.elevenlabs.io",
    path: "/v1/text-to-speech/MwzcTyuTKDKHFsZnTzKu",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS,
    },
  };

  const data = JSON.stringify({
    text: line,
    model_id: "eleven_english_v2",
    voice_settings: {
      stability: 0.3,
      similarity_boost: 1.0,
      style: 0.5,
    },
  });

  const apiReq = https.request(options, (apiRes) => {
    if (apiRes.statusCode !== 200) {
      console.error("ElevenLabs API returned:", apiRes.statusCode);
      return res.status(500).json({ error: "Wolf voice could not be summoned" });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    apiRes.pipe(res);
  });

  apiReq.on("error", (e) => {
    console.error("ElevenLabs Request Error:", e);
    res.status(500).json({ error: "Audio request failed" });
  });

  apiReq.write(data);
  apiReq.end();
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
