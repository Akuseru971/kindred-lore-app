const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/api/lore", async (req, res) => {
  try {
    const { pseudo, role, genre } = req.body;

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

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.data.choices[0]?.message?.content;
    res.json({ result: text });
  } catch (error) {
    console.error("Error during lore generation:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate lore" });
  }
});

app.post("/api/preview-audio", async (req, res) => {
  try {
    const { text } = req.body;
    const firstLine = text?.split("\n")[0]?.replace(/^Wolf:\s*/i, "").trim();

    if (!firstLine) {
      return res.status(400).json({ error: "Invalid input text." });
    }

    const formData = new FormData();
    formData.append("text", firstLine);
    formData.append("voice_id", "MwzcTyuTKDKHFsZnTzKu");
    formData.append("model_id", "eleven_english_v2");
    formData.append("stability", "0.3");
    formData.append("similarity_boost", "1.0");
    formData.append("style", "0.5");

    const response = await axios.post("https://api.elevenlabs.io/v1/text-to-speech/MwzcTyuTKDKHFsZnTzKu/stream", formData, {
      headers: {
        ...formData.getHeaders(),
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      responseType: "arraybuffer",
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.send(response.data);
  } catch (error) {
    console.error("Error generating preview audio:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate preview audio." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
