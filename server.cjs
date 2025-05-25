// server.cjs
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const https = require("https");
const fetch = require("node-fetch");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = "MwzcTyuTKDKHFsZnTzKu";

app.use(cors());
app.use(bodyParser.json());

app.post("/api/lore", async (req, res) => {
  const { pseudo = "a summoner", genre = "Unknown", role = "wanderer" } = req.body;

  const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying \"Tell me lamb, who is ${pseudo}?\" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the role itself to create the lore. Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like 'Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night.'
End with a cryptic line from Lamb that leaves a sense of mystery.
Limit the response to 12 exchanges max.`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Write a poetic and mysterious lore for a ${genre.toLowerCase()} player named ${pseudo}, who plays as a ${role} in the world of Runeterra.\n${prompt}`,
        },
      ],
      model: "gpt-4",
    });

    res.json({ lore: completion.choices[0].message.content });
  } catch (error) {
    console.error("Error generating lore:", error);
    res.status(500).send("Failed to summon Kindred's tale.");
  }
});

app.post("/api/preview", async (req, res) => {
  const { text } = req.body;
  if (!text || !elevenLabsApiKey) return res.status(400).send("Missing text or API key");

  const previewText = text.split("\n").find((line) => line.startsWith("Wolf:"));
  if (!previewText) return res.status(400).send("Wolf line not found");

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsApiKey,
      },
      body: JSON.stringify({
        model_id: "eleven_english_v2",
        text: previewText.replace(/^Wolf:\s*/, ""),
        voice_settings: {
          stability: 0.3,
          similarity_boost: 1.0,
          style: 0.5,
        },
      }),
    });

    const buffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error("Error generating preview:", err);
    res.status(500).send("Wolf voice could not be summoned");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
