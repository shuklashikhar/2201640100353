URL Shortener

A simple Node.js project to create short links.
Setup

Install dependencies:
npm install

Add your access token in a .env file:
ACCESS_TOKEN=your-token-here

Start the server:
node server.js

API
POST /shorturls → Create a short URL
GET /:shortcode → Redirect to original URL
GET /shorturls/:shortcode → Get stats for a short URL