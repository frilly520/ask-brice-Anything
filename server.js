import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chatHandler from "./api/chat.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp"
};

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // Handle /api/chat
    if (pathname === "/api/chat" || pathname === "/api/chat.js") {
      let rawBody = "";
      for await (const chunk of req) {
        rawBody += chunk;
      }

      try {
        req.body = rawBody ? JSON.parse(rawBody) : {};
      } catch {
        req.body = {};
      }

      res.status = (statusCode) => {
        res.statusCode = statusCode;
        return res;
      };

      res.json = (payload) => {
        if (!res.headersSent) {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
        }
        res.end(JSON.stringify(payload));
        return res;
      };

      await chatHandler(req, res);
      return;
    }

    // Serve static files
    let relativePath = pathname === "/" ? "/index.html" : pathname;
    // Prevent directory traversal
    const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
    let filePath = path.join(__dirname, safePath);

    // Check if file exists; if not and it's an asset under /assets/aistudio, also check /public/assets/aistudio
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const publicFallback = path.join(__dirname, "public", safePath);
      if (fs.existsSync(publicFallback) && !fs.statSync(publicFallback).isDirectory()) {
        filePath = publicFallback;
      } else {
        filePath = path.join(__dirname, "index.html");
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const content = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch (err) {
    console.error("Server error:", err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "Internal Server Error" } }));
    }
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Ask Brice server running at http://0.0.0.0:${PORT}`);
});
