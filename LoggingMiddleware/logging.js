const axios = require("axios");
require("dotenv").config();

async function Log(stack, level, pkg, message) {
  try {
    const logData = { stack, level, package: pkg, message };

    await axios.post("http://20.244.56.144/evaluation-service/logs", logData, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Remote log sent:", logData);
  } catch (err) {
    console.error("Failed to send log:", err.message);
  }
}

module.exports = { Log };
