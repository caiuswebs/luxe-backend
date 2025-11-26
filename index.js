const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const AI_API_KEY = "c0ccc6c6-0da4-44d0-b9e8-f9fbf88dfc52"; // SambaNova Key
const BUSAN_API_KEY = "YOUR_BUSAN_KEY_HERE"; // Optional: For real UID check

// Middleware
app.use(cors()); // Allow all connections
app.use(express.json());

// 1. PING ENDPOINT (For Server Status Indicator)
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'online', timestamp: Date.now() });
});

// 2. CHECK UID ENDPOINT
app.post('/check-uid', async (req, res) => {
    const { uid, zone } = req.body;

    console.log(`Checking UID: ${uid} | Zone: ${zone}`);

    // --- OPTION A: MOCK VALIDATION (Use this if you don't have a paid API yet) ---
    // This makes the site "Work" visually for all numbers.
    if(uid && uid.length > 4) {
        return res.json({
            success: true,
            nickname: `LuxePlayer_${uid.slice(-4)}` // Fakes a nickname
        });
    }

    // --- OPTION B: REAL BUSAN / API INTEGRATION (Uncomment to use) ---
    /*
    try {
        const response = await axios.post('https://api.busan.com/v1/check', {
            userid: uid,
            zoneid: zone,
            apikey: BUSAN_API_KEY
        });

        if (response.data.status === 200) {
            return res.json({ success: true, nickname: response.data.nickname });
        } else {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "API Error" });
    }
    */

    // If ID is too short or empty
    return res.status(400).json({ success: false, message: "Invalid ID Format" });
});

// 3. AI CHAT PROXY (Securely calls SambaNova)
app.post('/ai-chat', async (req, res) => {
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: "No message provided" });

    try {
        const response = await axios.post(
            "https://api.sambanova.ai/v1/chat/completions",
            {
                model: "Meta-Llama-3.1-8B-Instruct",
                messages: [
                    {
                        "role": "system", 
                        "content": "You are LuxeAI, a polite and helpful gaming assistant for the Luxe Store. You help with Mobile Legends (MLBB) builds, top-up issues, and account questions. Keep answers concise."
                    },
                    { "role": "user", "content": message }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${AI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const botReply = response.data.choices[0].message.content;
        res.json({ reply: botReply });

    } catch (error) {
        console.error("AI Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ reply: "I am currently experiencing high traffic. Please try again in a moment." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Luxe Backend running on port ${PORT}`);
});
