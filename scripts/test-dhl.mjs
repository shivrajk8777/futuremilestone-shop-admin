import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || "";
    value = value.trim().replace(/^['"](.*)['"]$/, "$1");
    env[match[1]] = value;
  }
});

const apiKey = env.DHL_API_KEY;
const apiSecret = env.DHL_API_SECRET;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log("=== DHL API CREDENTIAL VERIFICATION ===");
console.log(`API Key loaded: ${apiKey ? apiKey.slice(0, 6) + "..." + apiKey.slice(-4) : "NONE"}`);
console.log(`API Secret loaded: ${apiSecret ? apiSecret.slice(0, 6) + "..." + apiSecret.slice(-4) : "NONE"}`);

// 1. Test DHL Express (MyDHL) Sandbox
console.log("\n--- [1] Testing MyDHL Express Sandbox API ---");
try {
  const authString = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const myDhlUrl = `https://express.api.dhl.com/mydhlapi/test/shipments/1234567890/tracking`;
  
  const res = await fetch(myDhlUrl, {
    headers: {
      "DHL-API-Key": apiKey,
      "Authorization": `Basic ${authString}`,
      "Accept": "application/json"
    }
  });

  console.log(`Status: ${res.status} ${res.statusText}`);
  const text = await res.text();
  console.log(`Response: ${text.slice(0, 300)}`);
} catch (e) {
  console.error("MyDHL Test Error:", e.message);
}

await sleep(1500);

// 3. Test DHL Unified Production API with a dummy tracking number
console.log("\n--- [3] Testing DHL Unified Production Endpoint ---");
try {
  const prodUrl = `https://api-eu.dhl.com/track/shipments?trackingNumber=1234567890`;
  const res = await fetch(prodUrl, {
    headers: {
      "DHL-API-Key": apiKey,
      "Accept": "application/json"
    }
  });
  console.log(`Unified Production Status: ${res.status} ${res.statusText}`);
  const text = await res.text();
  console.log(`Response: ${text.slice(0, 300)}`);
} catch (e) {
  console.error("Unified Prod Error:", e.message);
}


