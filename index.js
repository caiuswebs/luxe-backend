require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// FIREBASE ADMIN SETUP
// Download serviceAccountKey.json from Firebase Console -> Project Settings -> Service Accounts
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://luxe-diamonds-recharge-default-rtdb.firebaseio.com"
});

const db = admin.database();

// BUSAN API CONFIG
const BUSAN_BASE = "https://1gamestopup.com/api/v1";
const BUSAN_KEY = process.env.BUSAN_API_KEY;
const BUSAN_SECRET = process.env.BUSAN_SECRET; // If required

// --- 1. SYNC PACKS (Admin Only) ---
app.post('/admin/sync-packs', async (req, res) => {
    try {
        // Example Busan Endpoint (Adjust based on actual Busan docs)
        const response = await axios.get(`${BUSAN_BASE}/api-service/products?game=mobile_legends`, {
            headers: { 'x-api-key': BUSAN_KEY }
        });

        const packs = response.data.data; // Adjust based on actual response structure
        const updates = {};

        packs.forEach(pack => {
            // Default margin 10%
            const margin = Math.ceil(pack.price * 0.10); 
            updates[`packs/${pack.id}`] = {
                busanId: pack.id,
                name: pack.name,
                busanPrice: pack.price,
                margin: margin,
                finalPrice: pack.price + margin,
                active: true
            };
        });

        await db.ref().update(updates);
        res.json({ success: true, message: "Packs Synced" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 2. VERIFY ID (Smart Fallback) ---
app.post('/verify-id', async (req, res) => {
    const { uid, zone } = req.body;
    try {
        const response = await axios.post(`${BUSAN_BASE}/api-service/validate-id`, {
            game: "mobile_legends", userid: uid, zoneid: zone
        }, { headers: { 'x-api-key': BUSAN_KEY } });

        if (response.data.success) {
            res.json({ status: "VALID", name: response.data.username });
        } else {
            res.json({ status: "INVALID" });
        }
    } catch (error) {
        // FALLBACK: If API fails/timeouts, allow manual check
        console.error("Busan API Error, switching to Manual");
        res.json({ status: "MANUAL_CHECK_REQ" }); 
    }
});

// --- 3. CREATE ORDER (Strict Validation) ---
app.post('/create-order', async (req, res) => {
    const { uid, zone, packId, utr, amount, userId } = req.body;

    // A. Strict UTR Check
    const utrRegex = /^[a-zA-Z0-9]{12,18}$/;
    if (!utrRegex.test(utr)) return res.status(400).json({ error: "Invalid UTR Format" });

    // B. Check Duplicate UTR
    const utrSnap = await db.ref(`used_utr/${utr}`).once('value');
    if (utrSnap.exists()) return res.status(400).json({ error: "UTR Already Used" });

    // C. Verify Price
    const packSnap = await db.ref(`packs/${packId}`).once('value');
    if (!packSnap.exists()) return res.status(400).json({ error: "Invalid Pack" });
    
    const pack = packSnap.val();
    if (parseFloat(amount) !== parseFloat(pack.finalPrice)) {
        return res.status(400).json({ error: "Amount Mismatch" });
    }

    // D. Create Order
    const orderId = db.ref('orders').push().key;
    const orderData = {
        orderId, uid, zone, packName: pack.name, 
        price: pack.finalPrice, busanId: pack.busanId,
        utr, status: "PENDING", userId, timestamp: Date.now()
    };

    // Atomic Update: Save Order + Lock UTR
    const updates = {};
    updates[`orders/${orderId}`] = orderData;
    updates[`used_utr/${utr}`] = { usedAt: Date.now(), orderId: orderId };

    await db.ref().update(updates);
    res.json({ success: true, orderId });
});

// --- 4. ADMIN PROCESS ORDER ---
app.post('/admin/process', async (req, res) => {
    const { orderId, action } = req.body; // action: 'APPROVE' or 'REJECT'
    
    const orderRef = db.ref(`orders/${orderId}`);
    const snapshot = await orderRef.once('value');
    const order = snapshot.val();

    if (!order) return res.status(404).json({ error: "Order not found" });

    if (action === 'REJECT') {
        await orderRef.update({ status: "REJECTED" });
        return res.json({ success: true, status: "REJECTED" });
    }

    if (action === 'APPROVE') {
        try {
            // Call Busan to Top-up
            const busanRes = await axios.post(`${BUSAN_BASE}/api-service/order`, {
                productId: order.busanId,
                playerId: order.uid,
                zoneId: order.zone
            }, { headers: { 'x-api-key': BUSAN_KEY } });

            if (busanRes.data.success) {
                await orderRef.update({ status: "COMPLETED", api_ref: busanRes.data.orderId });
                res.json({ success: true, status: "COMPLETED" });
            } else {
                throw new Error("Busan Failed");
            }
        } catch (error) {
            await orderRef.update({ status: "API_ERROR", errorLog: error.message });
            res.json({ success: false, message: "API Error - Manual Review Needed" });
        }
    }
});

// --- 5. AI CHAT PROXY (SambaNova) ---
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    try {
        // Replace with actual SambaNova endpoint/config
        const aiRes = await axios.post('https://api.sambanova.ai/v1/chat/completions', {
            model: "Meta-Llama-3-8B-Instruct",
            messages: [
                { role: "system", content: "You are LuxeBot, support for Luxe Store gaming top-ups. Be concise." },
                { role: "user", content: message }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.SAMBANOVA_KEY}` } });

        res.json({ reply: aiRes.data.choices[0].message.content });
    } catch (error) {
        res.json({ reply: "Support is currently offline. Please contact admin via WhatsApp." });
    }
});

app.listen(3000, () => console.log("Luxe Backend Running on 3000"));
