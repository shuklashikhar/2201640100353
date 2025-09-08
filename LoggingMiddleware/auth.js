const axios = require("axios");

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  const now = Date.now();

  // If token exists and not expired, reuse it
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  // Otherwise request new token
  const response = await axios.post("http://20.244.56.144/evaluation-service/auth", {
    email: "shuklashikhar2004@gmail.com",
  name: "Shikhar Shukla",
  rollNo: "2201640100353",
  accessCode: "sAWTuR",
  clientID: "f743b802-4412-4a4c-ad0f-38acb8f5507e",
    clientSecret: "DjwqZsswFQzDxxpu"
    // if API also needs role/other fields, include them here
  });

  cachedToken = response.data.access_token;
  // expire a bit earlier than real expiry to be safe
  tokenExpiry = now + (response.data.expires_in - 60) * 1000;

  return cachedToken;
}
console.log(getAccessToken())
module.exports = { getAccessToken };
