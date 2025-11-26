const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// HOME
app.get("/", (req, res) => {
  res.send("✅ Luxe REAL ID Checker Backend is Running");
});

// VERIFY ROUTE
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
    const response = await axios.post(
      "https://api.busan.com/mlbb/verify",
      {
        user_id: uid,
        zone_id: zone
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.BUSAN_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Log Busan raw response
    console.log("BUSAN RESPONSE:", response.data);

    if (response.data.status === "success") {
      res.json({
        success: true,
        valid: true,
        username: response.data.nickname || "Verified Player"
      });
    } else {
      res.json({
        success: true,
        valid: false,
        message: response.data.message || "Invalid MLBB ID"
      });
    }

  } catch (error) {
    console.error("BUSAN ERROR:", error.response?.data || error.message);

    res.json({
      success: false,
      valid: false,
      message: "Busan API Error",
      debug: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("✅ Luxe REAL ID Checker Running on port " + PORT);
});
