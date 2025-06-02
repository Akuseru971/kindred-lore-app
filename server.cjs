const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Endpoint pour générer le lore complet
app.post("/api/lore", async (req, res) => {
  const { pseudo, role, genre } = req.body;

  if (!pseudo || !role || !genre) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying 'Tell me lamb, who is ${pseudo}?'
no narrator needed, only lamb and wolf talk, it's a dialogue with no additonnal descriptions
Don't pay attention to the role itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like 'Wolf said', 'Lamb whispered', etc.
Make sure there is no narration.
Always generate exactly 12 lines of dialogue maximum.
The lore is for a ${genre.toLowerCase()} player named ${pseudo}, who plays as a ${role} in the world of Runeterra.
End with a cryptic line from Lamb that leaves a sense of mystery.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 500
    });

    const lore = completion.choices[0].message.content.trim();
    res.json({ lore });
  } catch (error) {
    console.error("Error generating lore:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate lore." });
  }
});

// Endpoint pour générer l'aperçu audio (uniquement la ligne de Wolf)
app.post("/api/preview-audio", async (req, res) => {
  const { pseudo, role, genre } = req.body;

  if (!pseudo || !role || !genre) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying 'Tell me lamb, who is ${pseudo}?'
no narrator needed, only lamb and wolf talk, it's a dialogue with no additonnal descriptions The structure is always "Wolf :" "and Lamb :" 
Don't pay attention to the role itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like 'Wolf said', 'Lamb whispered', etc.
Make sure there is no narration.
Always generate exactly 12 lines of dialogue maximum.
The lore is for a ${genre.toLowerCase()} player named ${pseudo}, who plays as a ${role} in the world of Runeterra.
End with a cryptic line from Lamb that leaves a sense of mystery.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      max_tokens: 500
    });

    const fullLore = completion.choices[0].message.content.trim();
    const firstLine = fullLore.split("\n").find(line => line.startsWith("Wolf:")) || "";

    if (!firstLine) {
      return res.status(500).json({ error: "Failed to extract Wolf's line." });
    }

    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/MwzcTyuTKDKHFsZnTzKu/stream",
      {
        text: firstLine.replace("Wolf:", "").trim(),
        voice_settings: {
          stability: 0.3,
          style: 0.5,
          similarity_boost: 1.0
        }
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'inline; filename="preview.mp3"'
    });
    res.send(response.data);
  } catch (error) {
    console.error("Error generating preview audio:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate preview audio." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
