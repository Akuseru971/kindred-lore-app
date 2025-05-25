// server.cjs
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const https = require("https");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/lore", async (req, res) => {
  try {
    const { pseudo = "Unknown", role = "mystery", genre = "being" } = req.body;

    const prompt = `
Structure your response as a dialogue between Lamb and Wolf, using their poetic tone only.
You must strictly respect this rule: DO NOT add any narrative descriptions between lines, such as "Wolf asked, eyes gleaming..." or "Lamb whispered gently...".
Only alternate pure lines of dialogue between Lamb and Wolf.

The response must always start with:
Wolf: "Tell me lamb, who is ${pseudo}?" Followed by another sentence giving a surname in relation with the lore.

You must not consider the player's role when building the lore.

The player is a ${genre.toLowerCase()} who plays as a ${role} in the world of Runeterra.

Limit the entire exchange to 12 lines of dialogue maximum (6 per character). Do not exceed.

End with a cryptic sentence from Lamb that leaves a sense of mystery.

Never break these rules. Never add a narrator. Only alternate dialogue.
`;


    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ lore: completion.choices[0].message.content });
  } catch (err) {
    console.error("Lore generation failed:", err);
    res.status(500).send("The voices refused to speak...");
  }
});

app.post("/api/preview", async (req, res) => {
  try {
    const { text = "Tell me lamb, who is the silent one?" } = req.body;

    const ELEVENLABS_VOICE_ID = "MwzcTyuTKDKHFsZnTzKu";
    const ELEVENLABS_MODEL_ID = "eleven_english_v2";

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_id: ELEVENLABS_MODEL_ID,
          text,
          voice_settings: {
            stability: 0.3,
            similarity_boost: 1.0,
            style: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API Error:", errorText);
      return res.status(500).send("Wolf voice could not be summoned");
    }

    const audioBuffer = await response.arrayBuffer();
    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.byteLength,
    });
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error("Voice preview error:", err);
    res.status(500).send("Wolf voice could not be summoned");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
