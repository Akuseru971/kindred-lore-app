// server.cjs
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY; // Assure-toi de bien appeler la variable comme ça
const WOLF_VOICE_ID = "MwzcTyuTKDKHFsZnTzKu";

const PORT = process.env.PORT || 10000;

app.post("/api/lore", async (req, res) => {
  const { pseudo, role, genre } = req.body;
  if (!pseudo || !role || !genre) return res.status(400).json({ error: "Missing parameters" });

  const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying \"Tell me lamb, who is ${pseudo}?\" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the rôle itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like \"Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night.\"
End with a cryptic line from Lamb that leaves a sense of mystery.
Limit the response to exactly 12 lines of dialogue.
Remember: the character is a ${genre.toLowerCase()} and their role is ${role}.`;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ lore: chatCompletion.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate lore" });
  }
});

app.post("/api/preview", async (req, res) => {
  const { line } = req.body;
  if (!line) return res.status(400).json({ error: "No line provided" });

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${WOLF_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsApiKey
        },
        body: JSON.stringify({
          text: line.replace(/^Wolf:\s*/, ""),
          model_id: "eleven_english_v2",
          voice_settings: {
            stability: 0.3,
            similarity_boost: 1.0,
            style: 0.5
          }
        })
      }
    );

    if (!response.ok) throw new Error("Voice generation failed");

    const buffer = await response.arrayBuffer();
    res.set({ "Content-Type": "audio/mpeg" });
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).json({ error: "Wolf voice could not be summoned" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
