const express = require("express");
const { v4: uuidv4 } = require("uuid");
const geoip = require("geoip-lite");
const { Log } = require("./LoggingMiddleware/logging");

const app = express();
app.use(express.json());

app.use(async (req, res, next) => {
  const log = {
    time: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    body: req.body,
  };

  console.log(JSON.stringify(log));
  await Log("backend", "info", "route", `Incoming ${req.method} ${req.url}`);
  next();
});

const urlDB = {};

function generateShortCode() {
  return uuidv4().slice(0, 6);
}

function isExpired(entry) {
  return new Date() > entry.expiry;
}

app.post("/shorturls", async (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  if (!url || typeof url !== "string") {
    await Log("backend", "warn", "route", "Invalid URL provided");
    return res.status(400).json({ error: "Invalid URL provided" });
  }

  let code = shortcode || generateShortCode();
  if (urlDB[code]) {
    await Log("backend", "warn", "db", "Shortcode already exists");
    return res.status(409).json({ error: "Shortcode already exists" });
  }

  const createdAt = new Date();
  const expiry = new Date(createdAt.getTime() + validity * 60000);

  urlDB[code] = {
    originalUrl: url,
    createdAt,
    expiry,
    clicks: [],
  };

  await Log("backend", "info", "db", `Short URL created for ${url}`);

  return res.status(201).json({
    shortLink: `http://localhost:3000/${code}`,
    expiry: expiry.toISOString(),
  });
});

app.get("/:shortcode", async (req, res) => {
  const code = req.params.shortcode;
  const entry = urlDB[code];

  if (!entry) {
    await Log("backend", "error", "db", `Shortcode ${code} not found`);
    return res.status(404).json({ error: "Shortcode not found" });
  }

  if (isExpired(entry)) {
    await Log("backend", "warn", "db", `Expired link accessed: ${code}`);
    return res.status(410).json({ error: "Link expired" });
  }

  const ip = req.ip || req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
  entry.clicks.push({
    timestamp: new Date(),
    referrer: req.get("Referrer") || "direct",
    location: geo ? geo.country : "unknown",
  });

  await Log(
    "backend",
    "info",
    "service",
    `Redirecting ${code} -> ${entry.originalUrl}`
  );
  return res.redirect(entry.originalUrl);
});

app.get("/shorturls/:shortcode", async (req, res) => {
  const code = req.params.shortcode;
  const entry = urlDB[code];

  if (!entry) {
    await Log(
      "backend",
      "error",
      "db",
      `Stats request for unknown code: ${code}`
    );
    return res.status(404).json({ error: "Shortcode not found" });
  }

  await Log("backend", "info", "service", `Stats fetched for ${code}`);

  return res.json({
    clickCount: entry.clicks.length,
    originalUrl: entry.originalUrl,
    createdAt: entry.createdAt.toISOString(),
    expiry: entry.expiry.toISOString(),
    clicks: entry.clicks,
  });
});

app.listen(3000, () => {
  console.log("URL Shortener running on http://localhost:3000");
});
