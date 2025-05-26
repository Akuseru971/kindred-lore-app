// === server.cjs ===
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
const https = require("https");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/lore", async (req, res) => {
  const { pseudo = "", genre = "Unknown", role = "Unknown" } = req.body;

  const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying \"Tell me lamb, who is ${pseudo}?\" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the rôle itself to create the lore.
Don't add narrator, when Wolf ends his sentence, it's Lamb's turn. I don't want to see any \"Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night.\"
End with a cryptic line from Lamb that leaves a sense of mystery.
Always generate exactly 12 lines.
The lore must reflect that the player is a ${genre.toLowerCase()} who plays ${role}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    res.json({ lore: completion.choices[0].message.content });
  } catch (err) {
    console.error("Error generating lore:", err);
    res.status(500).json({ error: "Lore could not be summoned." });
  }
});

app.post("/api/preview-audio", async (req, res) => {
  const { text = "Tell me lamb, who is the summoner?" } = req.body;
  const voiceId = "MwzcTyuTKDKHFsZnTzKu";

  const options = {
    hostname: "api.elevenlabs.io",
    path: `/v1/text-to-speech/${voiceId}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS,
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
    let chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("end", () => {
      const buffer = Buffer.concat(chunks);
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length,
      });
      res.send(buffer);
    });
  });

  request.on("error", (err) => {
    console.error("Preview audio error:", err);
    res.status(500).json({ error: "Wolf voice could not be summoned." });
  });

  request.write(data);
  request.end();
});

app.listen(10000, () => console.log("Server running on port 10000"));
