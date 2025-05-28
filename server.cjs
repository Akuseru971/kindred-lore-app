// server.cjs

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/api/lore", async (req, res) => {
  const { pseudo, role, genre } = req.body;

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
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const lore = completion.data.choices[0].message.content;
    res.json({ lore });
  } catch (error) {
    console.error("Error generating lore:", error);
    res.status(500).json({ error: "Failed to generate lore." });
  }
});

app.post("/api/preview-audio", async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: "No text provided." });

  const voiceID = "MwzcTyuTKDKHFsZnTzKu"; // Wolf voice ID
  const apiKey = process.env.ELEVENLABS_API_KEY;

  try {
    const response = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceID}`,
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      data: {
        text: text.replace(/^Wolf:\s*/i, ""),
        model_id: "eleven_english_v2",
        voice_settings: {
          stability: 0.3,
          similarity_boost: 1.0,
          style: 0.5,
        },
      },
      responseType: "arraybuffer",
    });

    const audioPath = path.join(__dirname, "wolf-preview.mp3");
    fs.writeFileSync(audioPath, response.data);

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": response.data.length,
    });
    res.send(response.data);
  } catch (error) {
    console.error("Audio preview generation failed:", error);
    res.status(500).json({ error: "Failed to generate preview audio." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
