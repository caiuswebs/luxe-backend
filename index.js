const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// ===== CONFIG =====
const BUSAN_API_KEY = process.env.BUSAN_API_KEY;
const BUSAN_URL = "https://1gamestopup.com/api/v1";

// ✅ Server status check
app.get("/", (req, res) => {
  res.send("✅ Luxe Backend Running - Smart Validation Active");
});


// ✅ SMART FREE MLBB ID VALIDATOR
app.post("/verify-id", async (req, res) => {
  const { uid, zone } = req.body;

  if (!uid || !zone) {
    return res.json({
      success: false,
      valid: false,
      message: "UID and Zone required"
    });
  }

  try {
    // Dummy product only for validation (use cheapest available)
    const testProduct = "mlbb_1_diamond"; // CHANGE to your cheapest productId from Busan

    const response = await axios.post(
      `${BUSAN_URL}/api-service/order`,
      {
        playerId: uid,
        zoneId: zone,
        productId: testProduct,
        currency: "INR"
      },
      {
        headers: {
          "x-api-key": BUSAN_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    // If Busan accepts = ID is REAL
    if (response.data && response.data.success) {
      return res.json({
        success: true,
        valid: true,
        username: "Verified MLBB Player"
      });
    }

    return res.json({
      success: true,
      valid: false,
      message: "Invalid MLBB ID"
    });

  } catch (error) {
    // Busan usually sends error if ID fake
    return res.json({
      success: true,
      valid: false,
      message: "Invalid MLBB ID"
    });
  }
});


// ✅ PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Luxe Backend Live on Port " + PORT));
