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
no narrator needed, only lamb and wolf talk, it's a dialogue with no additional descriptions.
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
