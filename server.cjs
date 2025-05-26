// server.cjs
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import https from 'https';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/lore', async (req, res) => {
  const { pseudo, genre, role } = req.body;

  if (!pseudo || !genre || !role) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const safePseudo = pseudo;
  const safeGenre = genre.toLowerCase();
  const safeRole = role;

  const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying \"Tell me lamb, who is ${safePseudo}?\" plus another sentence giving a surname in relation with the lore.
Don't add the description from the narrator between the lines of the dialogues. Don't pay attention to the role itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like \"Wolf asked, eyes twinkling with curiosity beneath the veil of the eternal night.\"
End with a cryptic line from Lamb that leaves a sense of mystery.
Respond with exactly 12 lines, alternating.
The player is a ${safeGenre} who plays as ${safeRole} in the world of Runeterra.`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'gpt-4',
    });

    const lore = completion.choices[0]?.message?.content;
    if (!lore) {
      return res.status(500).json({ error: 'No lore generated.' });
    }

    res.json({ lore });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'The voices did not answer.' });
  }
});

app.post('/api/preview', async (req, res) => {
  const { line } = req.body;
  const voiceId = 'MwzcTyuTKDKHFsZnTzKu';
  const apiKey = process.env.ELEVENLABS;

  if (!line || !apiKey) {
    return res.status(400).json({ error: 'Missing line or API key.' });
  }

  const options = {
    hostname: 'api.elevenlabs.io',
    path: `/v1/text-to-speech/${voiceId}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
  };

  const body = JSON.stringify({
    text: line.replace(/^Wolf:\s*/, ''),
    model_id: 'eleven_english_v2',
    voice_settings: {
      stability: 0.3,
      similarity_boost: 1.0,
      style: 0.5,
    },
  });

  const request = https.request(options, (response) => {
    if (response.statusCode !== 200) {
      return res.status(500).json({ error: 'Wolf voice could not be summoned.' });
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    response.pipe(res);
  });

  request.on('error', (error) => {
    console.error(error);
    res.status(500).json({ error: 'Wolf voice could not be summoned.' });
  });

  request.write(body);
  request.end();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
