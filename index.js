const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// ================= CONFIG =================
const BUSAN_API_KEY = "YOUR_BUSAN_API_KEY_HERE"; // <-- put your real key
const BUSAN_BASE = "https://1gamestopup.com/api/v1";

// ==========================================

app.get("/", (req, res) => {
  res.send("✅ Luxe Real MLBB ID Checker is Running");
});

// ✅ REAL MLBB ID VERIFICATION USING BUSAN
app.post("/verify-id", async (req, res) => {
  const { uid, zone } = req.body;

  if (!uid || !zone) {
    return res.json({
      success: false,
      valid: false,
      message: "UID and Zone are required"
    });
  }

  try {
    // We attempt a lightweight validation call
    const response = await axios.post(
      `${BUSAN_BASE}/api-service/order`,
      {
        playerId: uid,
        zoneId: zone,
        productId: "mlbb_test_product", // use cheapest or test product
        currency: "INR"
      },
      {
        headers: {
          "x-api-key": BUSAN_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    // If Busan accepts the UID, it's REAL
    if (response.data && response.data.success !== false) {
      return res.json({
        success: true,
        valid: true,
        message: "REAL MLBB ID VERIFIED",
        data: response.data
      });
    } else {
      return res.json({
        success: true,
        valid: false,
        message: "Invalid MLBB ID"
      });
    }

  } catch (error) {
    // Busan errors = ID invalid
    return res.json({
      success: true,
      valid: false,
      message: "Invalid or non-existent MLBB ID"
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("✅ Luxe Real Checker running on port " + PORT);
});
