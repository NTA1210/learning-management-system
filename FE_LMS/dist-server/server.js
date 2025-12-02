import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
// @ts-ignore
import prerender from "prerender-node";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
// --- Prerender setup ---
prerender.set(
  "prerenderServiceUrl",
  process.env.VITE_PRERENDER_SERVICE_URL || "http://localhost:3001"
);
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
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
