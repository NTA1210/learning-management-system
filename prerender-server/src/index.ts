import dotenv from "dotenv";
dotenv.config();

// @ts-ignore
import prerender from "prerender";

const PORT = Number(process.env.PRERENDER_PORT) || 3001;
const CHROME_PATH = process.env.CHROME_LOCATION || "/usr/bin/google-chrome";

process.env.CHROME_LOCATION = CHROME_PATH;

const server = prerender();

server.start({ port: PORT });

console.log(`🚀 Prerender server running on http://localhost:${PORT}`);
console.log(`Using Chrome at: ${CHROME_PATH}`);
