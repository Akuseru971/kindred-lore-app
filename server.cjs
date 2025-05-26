const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
const https = require("https");
const fs = require("fs");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/lore", async (req, res) => {
  const { pseudo, genre = "man", role = "mid" } = req.body;

  const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying "Tell me lamb, who is ${pseudo}?" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the rôle itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like "Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night."
End with a cryptic line from Lamb that leaves a sense of mystery.
Limit the response to exactly 12 lines of pure dialogue only.
Integrate the genre '${genre.toLowerCase()}' in the narrative context.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const lore = completion.choices[0]?.message?.content;
    res.json({ lore });
  } catch (err) {
    console.error("Error generating lore:", err);
    res.status(500).json({ error: "Failed to generate lore" });
  }
});

app.post("/api/preview-audio", async (req, res) => {
  const { text } = req.body;

  const voiceId = "MwzcTyuTKDKHFsZnTzKu";
  const elevenApiKey = process.env.ELEVENLABS;

  const payload = {
    text: text.replace(/^Wolf:\s*/i, ""),
    model_id: "eleven_english_v2",
    voice_settings: {
      stability: 0.3,
      similarity_boost: 1.0,
      style: 0.5,
    },
  };

  try {
    const audioRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!audioRes.ok) {
      throw new Error("Failed to generate audio preview");
    }

    const audioBuffer = await audioRes.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("Audio preview failed:", err);
    res.status(500).json({ error: "Wolf voice could not be summoned" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
