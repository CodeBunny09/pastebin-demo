import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { db } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

function nowMs(req) {
  if (process.env.TEST_MODE === "1") {
    const h = req.header("x-test-now-ms");
    if (h) return parseInt(h, 10);
  }
  return Date.now();
}

// Health check
app.get("/api/healthz", (req, res) => {
  db.get("SELECT 1", [], (err) => {
    if (err) return res.status(500).json({ ok: false });
    res.json({ ok: true });
  });
});

// Create paste
app.post("/api/pastes", (req, res) => {
  const { content, ttl_seconds, max_views } = req.body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Invalid content" });
  }
  if (ttl_seconds !== undefined) {
    if (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)
      return res.status(400).json({ error: "Invalid ttl_seconds" });
  }
  if (max_views !== undefined) {
    if (!Number.isInteger(max_views) || max_views < 1)
      return res.status(400).json({ error: "Invalid max_views" });
  }

  const id = nanoid(8);
  const created = Date.now();
  const expires = ttl_seconds ? created + ttl_seconds * 1000 : null;

  db.run(
    `INSERT INTO pastes 
     (id, content, created_at, expires_at, max_views, view_count)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [id, content, created, expires, max_views ?? null],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error" });

      res.json({
        id,
        url: `${req.protocol}://${req.get("host")}/p/${id}`
      });
    }
  );
});

// List all active pastes (for gallery)
app.get("/api/pastes", (req, res) => {
  const now = nowMs(req);

  db.all("SELECT * FROM pastes", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB error" });

    const active = rows
      .filter(row => {
        if (row.expires_at && now >= row.expires_at) return false;
        if (row.max_views && row.view_count >= row.max_views) return false;
        return true;
      })
      .map(row => ({
        id: row.id,
        url: `${req.protocol}://${req.get("host")}/p/${row.id}`,
        content: row.content
      }));

    res.json(active);
  });
});

// Fetch paste metadata WITHOUT incrementing views (for gallery)
// ⚠️ CRITICAL: This MUST be registered BEFORE /api/pastes/:id
app.get("/api/pastes/:id/meta", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM pastes WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Not found" });

    const now = nowMs(req);

    if (row.expires_at && now >= row.expires_at)
      return res.status(404).json({ error: "Not found" });

    if (row.max_views && row.view_count >= row.max_views)
      return res.status(404).json({ error: "Not found" });

    const remaining =
      row.max_views === null ? null : Math.max(row.max_views - row.view_count, 0);

    res.json({
      current_views: row.view_count,
      max_views: row.max_views,
      remaining_views: remaining,
      expires_at: row.expires_at
        ? new Date(row.expires_at).toISOString()
        : null
    });
  });
});

// Internal loader
function loadPaste(req, res, next) {
  const { id } = req.params;
  db.get("SELECT * FROM pastes WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Not found" });

    const now = nowMs(req);

    if (row.expires_at && now >= row.expires_at)
      return res.status(404).json({ error: "Not found" });

    if (row.max_views && row.view_count >= row.max_views)
      return res.status(404).json({ error: "Not found" });

    req.paste = row;
    next();
  });
}

// Fetch paste API
app.get("/api/pastes/:id", loadPaste, (req, res) => {
  const p = req.paste;

  db.run("UPDATE pastes SET view_count = view_count + 1 WHERE id = ?", [
    p.id
  ]);

  const remaining =
    p.max_views === null ? null : Math.max(p.max_views - (p.view_count + 1), 0);

  res.json({
    content: p.content,
    remaining_views: remaining,
    expires_at: p.expires_at ? new Date(p.expires_at).toISOString() : null
  });
});

// HTML view
app.get("/p/:id", loadPaste, (req, res) => {
  const p = req.paste;

  db.run("UPDATE pastes SET view_count = view_count + 1 WHERE id = ?", [
    p.id
  ]);

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!doctype html>
    <html>
      <body>
        <pre>${escapeHtml(p.content)}</pre>
      </body>
    </html>
  `);
});

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Backend running on " + PORT));