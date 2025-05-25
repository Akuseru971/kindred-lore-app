const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// ✅ Nouvelle façon d'initialiser OpenAI avec la v4
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔮 Route API
app.post("/api/lore", async (req, res) => {
  const { pseudo, genre, role } = req.body;

  const prompt = `
You are Lamb and Wolf from League of Legends.
Write a poetic and mysterious lore for a ${genre.toLowerCase()} player named ${pseudo}, who plays as a ${role} in the world of Runeterra.
Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
End with a cryptic line from Lamb that leaves a sense of mystery.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 700,
    });

    res.json({ lore: completion.choices[0].message.content });
  } catch (err) {
    console.error("OpenAI error:", err);
    res.status(500).json({ error: "Failed to summon Kindred's lore." });
  }
});

// 🚀 Lancement du serveur
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
