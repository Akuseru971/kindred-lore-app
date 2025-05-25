require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
const https = require("https");

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Lore Generation Endpoint
app.post("/api/lore", async (req, res) => {
  const { pseudo = "Unknown", genre = "Man", role = "mid" } = req.body;

  const prompt = `
Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying "Tell me lamb, who is ${pseudo}?" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the role itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like "Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night."
End with a cryptic line from Lamb that leaves a sense of mystery.
`.trim();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const lore = response.choices[0]?.message?.content;
    if (!lore) return res.status(500).json({ error: "No tale was found..." });
    res.json({ lore });
  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: "The voices did not answer..." });
  }
});

// Voice Preview Endpoint
app.post("/api/preview-voice", async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid or missing text." });
  }

  const voiceId = "MwzcTyuTKDKHFsZnTzKu"; // Wolf
  const elevenApiKey = process.env.ELEVENLABS;

  const options = {
    hostname: "api.elevenlabs.io",
    path: `/v1/text-to-speech/${voiceId}`,
    method: "POST",
    headers: {
      "xi-api-key": elevenApiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
  };

  const data = JSON.stringify({
    text,
    model_id: "eleven_english_v2",
    voice_settings: {
      stability: 0.3,
      similarity_boost: 1.0,
      style: 0.5,
    },
  });

  const request = https.request(options, (response) => {
    if (response.statusCode !== 200) {
      console.error("ElevenLabs API failed:", response.statusCode);
      return res.status(500).json({ error: "Wolf voice could not be summoned" });
    }
    res.setHeader("Content-Type", "audio/mpeg");
    response.pipe(res);
  });

  request.on("error", (error) => {
    console.error("ElevenLabs Request Error:", error);
    res.status(500).json({ error: "Wolf voice could not be summoned" });
  });

  request.write(data);
  request.end();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
