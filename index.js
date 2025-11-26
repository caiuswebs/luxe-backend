const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

// ========== CONFIG ==========
const BUSAN_BASE_URL = "https://1gamestopup.com/api/v1";
const BUSAN_API_KEY = process.env.BUSAN_API_KEY; // Set this in Railway Variables

// ========== STATUS ROUTE ==========
app.get("/", (req, res) => {
  res.json({
    status: "online",
    server: "Luxe ID Checker Backend",
    time: new Date().toISOString()
  });
});

// ========== MLBB REAL ID VERIFICATION ==========
app.post("/verify-id", async (req, res) => {
  const { uid, zone } = req.body;

  if (!uid || !zone) {
    return res.json({
      success: false,
      valid: false,
      message: "UID and Zone are required"
    });
  }

  // Basic pattern safety (pre-check)
  if (!/^\d+$/.test(uid) || !/^\d+$/.test(zone)) {
    return res.json({
      success: true,
      valid: false,
      message: "ID must contain numbers only"
    });
  }

  try {
    /*
      ⚠️ IMPORTANT:
      Busan does not provide a public 'verify-only' endpoint in some plans.
      So the industry standard method is:
      - Try a small validation/dry-run order OR
      - Use their validator if enabled for your account

      Below is a SAFE VALIDATION REQUEST using their structure.
    */

    const response = await axios.post(
      `${BUSAN_BASE_URL}/api-service/validate-id`,
      {
        game: "mobile_legends",
        userid: uid,
        zoneid: zone
      },
      {
        headers: {
          "x-api-key": BUSAN_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    // If Busan confirms ID
    if (response.data && response.data.success) {
      return res.json({
        success: true,
        valid: true,
        username: response.data.username || "Verified Player"
      });
    } else {
      return res.json({
        success: true,
        valid: false,
        message: "Invalid MLBB ID"
      });
    }

  } catch (error) {
    console.error("Busan Verify Error:", error.message);

    return res.json({
      success: false,
      valid: false,
      message: "Verification failed or service unavailable"
    });
  }
});

// ========== SERVER START ==========
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("✅ Luxe Backend running on port " + PORT);
});


