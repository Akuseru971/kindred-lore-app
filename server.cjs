// === server.cjs ===
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/lore", async (req, res) => {
  const { pseudo = "Unknown", genre = "Unknown", role = "Unknown" } = req.body;

  const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying \"Tell me lamb, who is ${pseudo}?\" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the rôle itself to create the lore. 
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like 'Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night.'
End with a cryptic line from Lamb that leaves a sense of mystery.`;

  try {
    const chat = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
    });
    res.json({ lore: chat.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).send("The spirits are silent...");
  }
});

app.post("/api/preview", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send("No text provided");

  const voiceId = "MwzcTyuTKDKHFsZnTzKu"; // Wolf
  const apiKey = process.env.ELEVEN_LABS_API_KEY;

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 1.0,
          style: 0.5,
        },
        text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).send("ElevenLabs Error: " + errorText);
    }

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'inline; filename="preview.mp3"',
    });

    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Wolf voice could not be summoned");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
