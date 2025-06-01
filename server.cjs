const axios = require("axios");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const promptTemplate = `
Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying 'Tell me lamb, who is \${pseudo}?'
no narrator needed, only lamb and wolf talk, it's a dialogue with no additional descriptions. The structure is always "Wolf :" "and Lamb :" 
Don't pay attention to the role itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like 'Wolf said', 'Lamb whispered', etc.
Make sure there is no narration.
Always generate exactly 12 lines of dialogue maximum.
The lore is for a \${genre.toLowerCase()} player named \${pseudo}, who plays as a \${role} in the world of Runeterra.
End with a cryptic line from Lamb that leaves a sense of mystery.
`;

app.post("/api/lore", async (req, res) => {
  const { pseudo, role, genre } = req.body;
  if (!pseudo || !role || !genre) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const prompt = promptTemplate
      .replace(/\${pseudo}/g, pseudo)
      .replace(/\${role}/g, role)
      .replace(/\${genre.toLowerCase()}/g, genre.toLowerCase());

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a poetic and mysterious narrator." },
        { role: "user", content: prompt },
      ],
    });

    const lore = completion.choices[0].message.content.trim();
    res.json({ lore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while generating the lore." });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.post("/api/preview", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  try {
    const response = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/MwzcTyuTKDKHFsZnTzKu/stream",
      {
        text,
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

