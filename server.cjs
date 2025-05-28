const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

app.post("/api/lore", async (req, res) => {
  const { pseudo, genre, role } = req.body;

  if (!pseudo || !genre || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const prompt = `
Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying 'Tell me lamb, who is ${pseudo}?'
no narrator needed, only lamb and wolf talk, it's a dialogue with no additonnal descriptions
Don't pay attention to the role itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like 'Wolf said', 'Lamb whispered', etc.
Make sure there is no narration.
Always generate exactly 12 lines of dialogue maximum.
The lore is for a ${genre.toLowerCase()} player named ${pseudo}, who plays as a ${role} in the world of Runeterra.
End with a cryptic line from Lamb that leaves a sense of mystery.
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: prompt.trim(),
          },
        ],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const lore = data.choices?.[0]?.message?.content;

    if (!lore) {
      return res.status(500).json({ error: "Failed to generate lore" });
    }

    res.json({ lore });
  } catch (err) {
    console.error("Error generating lore:", err);
    res.status(500).json({ error: "Something went wrong generating the lore." });
  }
});

app.post("/api/preview-audio", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid or missing 'text' in request body." });
  }

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
