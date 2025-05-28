// server.cjs
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 10000;

dotenv.config();

app.use(cors({ origin: 'https://kindred-ui.onrender.com' }));
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const ELEVENLABS_VOICE_ID = 'MwzcTyuTKDKHFsZnTzKu';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS;

app.post('/api/lore', async (req, res) => {
  const { pseudo, role, genre } = req.body;

  if (!pseudo || !role || !genre) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    const prompt = `Structure your response as a dialogue between Lamb and Wolf, using their tone and poetic style.
The first sentence is always Wolf saying 'Tell me lamb, who is ${pseudo}?' 
no narrator needed, only lamb and wolf talk, it's a dialogue with no additonnal descriptions
Don't pay attention to the role itself to create the lore.
Don't add narrator — when Wolf ends his sentence, it's Lamb's turn. I don't want to see any description like 'Wolf said', 'Lamb whispered', etc.
Make sure there is no narration.
Always generate exactly 12 lines of dialogue maximum.
The lore is for a ${genre.toLowerCase()} player named ${pseudo}, who plays as a ${role} in the world of Runeterra.
End with a cryptic line from Lamb that leaves a sense of mystery.`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const lore = completion.data.choices[0].message.content;
    res.json({ lore });
  } catch (error) {
    console.error('Error generating lore:', error);
    res.status(500).json({ error: 'Failed to generate lore.' });
  }
});

app.post('/api/preview-audio', async (req, res) => {
  const { text } = req.body;

  if (!text) return res.status(400).json({ error: 'No text provided' });

  try {
    const wolfLine = text.split('\n').find((line) => line.startsWith('Wolf:'));
    if (!wolfLine) return res.status(400).json({ error: 'No Wolf line found.' });

    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      data: {
        text: wolfLine.replace(/^Wolf:\s*/i, ''),
        model_id: 'eleven_english_v2',
        voice_settings: {
          stability: 0.3,
          similarity_boost: 1.0,
          style: 0.5,
        },
      },
      responseType: 'arraybuffer',
    });

    const filePath = path.join('/tmp', `wolf-preview-${Date.now()}.mp3`);
    fs.writeFileSync(filePath, response.data);
    res.sendFile(filePath);
  } catch (err) {
    console.error('Preview audio generation failed:', err);
    res.status(500).json({ error: 'Wolf voice could not be summoned.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
