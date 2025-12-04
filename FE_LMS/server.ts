import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
// @ts-ignore
import prerender from "prerender-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Serve robots & sitemap trước khi prerender
app.use(
  "/robots.txt",
  express.static(path.join(__dirname, "public", "robots.txt"))
);
app.use(
  "/sitemap.xml",
  express.static(path.join(__dirname, "public", "sitemap.xml"))
);

// --- Prerender setup ---
const PRERENDER_SERVICE_URL = process.env.PRERENDER_SERVICE_URL;
prerender.set("prerenderServiceUrl", PRERENDER_SERVICE_URL);
app.use(prerender);

// --- FE static ---
const reactDistPath = path.resolve(__dirname, "dist");
app.use(express.static(reactDistPath));

console.log("dirname", __dirname);
console.log("filename", __filename);
console.log("reactDistPath", reactDistPath);

// --- SPA route ---
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(reactDistPath, "index.html"));
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("Connect to prerender server:", PRERENDER_SERVICE_URL);
});
