const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { OpenAIApi, Configuration } = require("openai");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

// Middlewares
app.use(bodyParser.json());
app.use(cors());

// Configuration OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Prompt constant
const BASE_PROMPT = `
Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying 'Tell me lamb, who is \${pseudo}?'
no narrator needed, only lamb and wolf talk, it's a dialogue with no additonnal descriptions
Don't pay attention to the role itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like 'Wolf said', 'Lamb whispered', etc.
Make sure there is no narration.
Always generate exactly 12 lines of dialogue maximum.
The lore is for a \${genre.toLowerCase()} player named \${pseudo}, who plays as a \${role} in the world of Runeterra.
End with a cryptic line from Lamb that leaves a sense of mystery.
`;

// Routes
app.post("/api/lore", async (req, res) => {
  const { pseudo, role, genre } = req.body;

  if (!pseudo || !role || !genre) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const prompt = BASE_PROMPT.replace(/\${pseudo}/g, pseudo)
                            .replace(/\${role}/g, role)
                            .replace(/\${genre.toLowerCase()}/g, genre.toLowerCase());

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a poetic and mysterious lore generator."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.7
    });

    const lore = response.data.choices[0]?.message?.content?.trim();
    res.json({ lore });
  } catch (error) {
    console.error("Error generating lore:", error);
    res.status(500).json({ error: "Failed to generate lore." });
  }
});

// Server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
