require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 10000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(bodyParser.json());

app.post('/api/lore', async (req, res) => {
  const { pseudo, genre = 'man', role = 'mid' } = req.body;

  if (!pseudo) return res.status(400).json({ error: 'Missing pseudo' });

  const prompt = `
Structure your response strictly as a dialogue between Lamb and Wolf, using their poetic and mysterious tone.
The first line must always be Wolf saying: "Tell me Lamb, who is ${pseudo}?" followed by another sentence giving a surname related to the lore.

You MUST NOT include any narrative descriptions, such as "Wolf said", "Lamb whispered", or any action, setting, or emotional commentary. 
Do NOT use any form of prose or narration outside of the actual spoken lines.

Each line must begin directly with "Wolf:" or "Lamb:" — and nothing else. 
Never insert a line of narration or a third-person observer.

The total number of lines in the dialogue must be 8 maximum, alternating between Wolf and Lamb.

End with a cryptic and mysterious line from Lamb.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    res.json({ lore: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error generating lore:', error);
    res.status(500).json({ error: 'Failed to generate lore' });
  }
});

app.post('/api/preview', async (req, res) => {
  const { line } = req.body;

  if (!line) return res.status(400).json({ error: 'Missing line' });

  const options = {
    hostname: 'api.elevenlabs.io',
    path: '/v1/text-to-speech/MwzcTyuTKDKHFsZnTzKu/stream',
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVEN_LABS_API_KEY,
      'Content-Type': 'application/json',
    },
  };

  const data = JSON.stringify({
    text: line.replace('Wolf:', '').trim(),
    model_id: 'eleven_english_v2',
    voice_settings: {
      stability: 0.3,
      similarity_boost: 1.0,
      style: 0.5,
    },
  });

  const request = https.request(options, (response) => {
    res.setHeader('Content-Type', 'audio/mpeg');
    response.pipe(res);
  });

  request.on('error', (e) => {
    console.error('Error with ElevenLabs API:', e);
    res.status(500).json({ error: 'Wolf voice could not be summoned' });
  });

  request.write(data);
  request.end();
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
