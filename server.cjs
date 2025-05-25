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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/lore", async (req, res) => {
  const { pseudo = "", genre = "man", role = "mid" } = req.body;

  const prompt = `
Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying "Tell me lamb, who is ${pseudo}?" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues.
Don't pay attention to the rôle itself to create the lore.
I don't want any narrator — when Wolf ends his sentence, it's Lamb's turn.
I don’t want to see anything like “Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night.”
Limit your response to a maximum of 8 lines (4 each).
End with a cryptic line from Lamb that leaves a sense of mystery.
`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
    });

    res.json({ lore: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Kindred are silent..." });
  }
});

app.post("/api/preview-audio", async (req, res) => {
  const { pseudo = "" } = req.body;
  const wolfLine = `Tell me lamb, who is ${pseudo}? The name echoes like a shadow among graves.`;

  const options = {
    hostname: "api.elevenlabs.io",
    path: "/v1/text-to-speech/MwzcTyuTKDKHFsZnTzKu/stream",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVEN_LABS_API_KEY,
    },
  };

  const data = JSON.stringify({
    text: wolfLine,
    model_id: "eleven_english_v2",
    voice_settings: {
      stability: 0.3,
      similarity_boost: 1.0,
      style: 0.5,
    },
  });

  const request = https.request(options, (response) => {
    res.setHeader("Content-Type", "audio/mpeg");
    response.pipe(res);
  });

  request.on("error", (err) => {
    console.error(err);
    res.status(500).json({ error: "Wolf voice could not be summoned." });
  });

  request.write(data);
  request.end();
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
