import { useState } from "react";
import PasteGallery from "./PasteGallery.jsx";

export default function PasteCreator() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("");
  const [views, setViews] = useState("");
  const [error, setError] = useState(null);

  async function createPaste() {
    setError(null);

    const body = { content };
    if (ttl) body.ttl_seconds = Number(ttl);
    if (views) body.max_views = Number(views);

    const res = await fetch("/api/pastes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) return setError(data.error || "Error");

    setContent("");
    setTtl("");
    setViews("");
  }

  return (
    <>
      {/* INPUT SECTION */}
      <div className="input-panel">
        <h2>Pastebin Lite</h2>

        <textarea
          rows={8}
          placeholder="Paste text here"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="row">
          <label>TTL (seconds)</label>
          <input 
            type="text"
            placeholder="Optional - leave empty for no expiration"
            value={ttl} 
            onChange={(e) => setTtl(e.target.value)} 
          />
        </div>

        <div className="row">
          <label>Max Views</label>
          <input 
            type="text"
            placeholder="Optional - leave empty for unlimited"
            value={views} 
            onChange={(e) => setViews(e.target.value)} 
          />
        </div>

        <button onClick={createPaste}>Create Paste</button>

        {error && <p className="error">{error}</p>}
      </div>

      {/* GALLERY SECTION */}
      <div className="gallery-panel">
        <h3>Live Gallery</h3>
        <PasteGallery />
      </div>
    </>
  );
}