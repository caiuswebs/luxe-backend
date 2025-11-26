const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const AI_API_KEY = "c0ccc6c6-0da4-44d0-b9e8-f9fbf88dfc52"; 

app.use(cors());
app.use(express.json());

// --- 1. HOME ROUTE (Add this so you don't get "Not Found") ---
app.get('/', (req, res) => {
    res.send('✅ Luxe Store Backend is Active!');
});

// --- 2. PING ROUTE ---
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'online', timestamp: Date.now() });
});

// --- 3. CHECK UID ROUTE ---
app.post('/check-uid', async (req, res) => {
    const { uid, zone } = req.body;
    if(uid && uid.length > 4) {
        return res.json({ success: true, nickname: `LuxePlayer_${uid.slice(-4)}` });
    }
    return res.status(400).json({ success: false, message: "Invalid ID Format" });
});

// --- 4. AI CHAT ROUTE ---
app.post('/ai-chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    try {
        const response = await axios.post(
            "https://api.sambanova.ai/v1/chat/completions",
            {
                model: "Meta-Llama-3.1-8B-Instruct",
                messages: [
                    { "role": "system", "content": "You are LuxeAI. Keep answers short." },
                    { "role": "user", "content": message }
                ]
            },
            { headers: { "Authorization": `Bearer ${AI_API_KEY}`, "Content-Type": "application/json" } }
        );
        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ reply: "AI Busy." });
    }
});

app.listen(PORT, () => console.log(`✅ Luxe Backend running on port ${PORT}`));
