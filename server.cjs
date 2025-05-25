const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");
const https = require("https");

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ELEVENLABS_VOICE_ID = "MwzcTyuTKDKHFsZnTzKu";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

app.post("/api/lore", async (req, res) => {
  const { pseudo = "Unknown", genre = "Unknown", role = "Unknown" } = req.body;

  const prompt = `
Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying "Tell me lamb, who is ${pseudo}?" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the rôle itself to create the lore. 10 répliques maximum
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like 'Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night.'
End with a cryptic line from Lamb that leaves a sense of mystery.
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
    });

    const lore = completion.choices[0].message.content;
    res.json({ lore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to summon Kindred." });
  }
});

app.post("/api/preview", async (req, res) => {
  const { text } = req.body;

  if (!text || !ELEVENLABS_API_KEY) {
    return res.status(400).json({ error: "Missing text or ElevenLabs API key." });
  }

  const previewText = text.split("\n").find((line) => line.startsWith("Wolf:"))?.replace("Wolf:", "").trim();

  if (!previewText) {
    return res.status(400).json({ error: "No Wolf line found in the lore." });
  }

  const options = {
    hostname: "api.elevenlabs.io",
    path: `/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
    },
  };

  const data = JSON.stringify({
    model_id: "eleven_english_v2",
    text: previewText,
    voice_settings: {
      stability: 0.3,
      similarity_boost: 1.0,
      style: 0.5,
    },
  });

  const elevenReq = https.request(options, (elevenRes) => {
    res.setHeader("Content-Type", "audio/mpeg");
    elevenRes.pipe(res);
  });

  elevenReq.on("error", (error) => {
    console.error("Error with ElevenLabs request:", error);
    res.status(500).json({ error: "Wolf voice could not be summoned." });
  });

  elevenReq.write(data);
  elevenReq.end();
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
