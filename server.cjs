const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/lore', async (req, res) => {
  const { pseudo } = req.body;

  const prompt = `
You are Kindred, the twin essences of death in Runeterra.
You will now narrate the legend of a summoner named "${pseudo}" as a dialogue between Lamb and Wolf. The style is poetic, mysterious, and inspired by League of Legends lore, you create new one by putting the character in on of the famous regions of runeterra, putting him in relation with other existing champions.

Format:
Wolf: ...
Lamb: ...
(...)

Make it immersive and atmospheric, 10-12 lines total.
`;

  try {
    const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.9,
});


const lore = response.choices[0].message.content;
res.json({ lore });

  } catch (err) {
    res.status(500).json({ error: 'Failed to generate lore' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
