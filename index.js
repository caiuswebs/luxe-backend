const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;

// 🔑 YOUR BUSAN API KEY (SET THIS IN RAILWAY ENV VARIABLES)
const BUSAN_API_KEY = process.env.BUSAN_API_KEY;
const BUSAN_URL = "https://1gamestopup.com/api/v1";

// ✅ STATUS ROUTE
app.get("/", (req, res) => {
  res.send("✅ Luxe REAL ID Checker Backend is Running");
});

// ✅ 100% REAL MLBB ID CHECK
app.post("/verify-id", async (req, res) => {
  const { uid, zone } = req.body;

  if (!uid || !zone) {
    return res.json({
      success: false,
      valid: false,
      message: "UID and Zone required"
    });
  }

  // Basic safety check
  if (!/^\d+$/.test(uid) || !/^\d+$/.test(zone)) {
    return res.json({
      success: true,
      valid: false,
      message: "ID must be numbers only"
    });
  }

  try {
    const response = await axios.post(
      `${BUSAN_URL}/api-service/validate-id`,
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

    // ✅ Only TRUE if Busan confirms
    if (response.data && (response.data.success || response.data.username)) {
      return res.json({
        success: true,
        valid: true,
        username: response.data.username || "MLBB Player"
      });
    } else {
      return res.json({
        success: true,
        valid: false,
        message: "Invalid MLBB ID"
      });
    }

  } catch (error) {
    console.error("Busan Error:", error.message);
    return res.json({
      success: false,
      valid: false,
      message: "Verification failed"
    });
  }
});

app.listen(PORT, () => {
  console.log("✅ Luxe REAL ID Checker Running on port " + PORT);
});
