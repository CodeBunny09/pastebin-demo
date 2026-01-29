import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";


export default function PasteCard({ paste }) {
  const [meta, setMeta] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    let interval;
    let metaInterval;

    async function loadMeta() {
      const res = await fetch(`${API_BASE}/api/pastes/${paste.id}/meta`);
      if (!res.ok) return;

      const data = await res.json();
      setMeta(data);

      if (data.expires_at) {
        const expireMs = new Date(data.expires_at).getTime();
        
        // Initial countdown
        const diff = expireMs - Date.now();
        if (diff <= 0) {
          setTimeLeft("Expired");
        } else {
          setTimeLeft(Math.ceil(diff / 1000) + "s");
        }

        // Update every second
        interval = setInterval(() => {
          const diff = expireMs - Date.now();
          if (diff <= 0) {
            setTimeLeft("Expired");
            clearInterval(interval);
          } else {
            setTimeLeft(Math.ceil(diff / 1000) + "s");
          }
        }, 1000);
      }
    }

    loadMeta();
    // Refresh meta every 2 seconds to get updated view counts
    metaInterval = setInterval(loadMeta, 2000);

    return () => {
      if (interval) clearInterval(interval);
      if (metaInterval) clearInterval(metaInterval);
    };
  }, [paste.id]);

  // Format views as "current/max" or "∞" if unlimited
  const formatViews = () => {
    if (meta === null) return "...";
    if (meta.max_views === null) return "∞";
    return `${meta.current_views}/${meta.max_views}`;
  };

  return (
    <motion.a
      href={`/p/${paste.id}`}
      target="_blank"
      className="paste-card"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
    >
      <div className="paste-preview">
        {paste.content.slice(0, 80)}...
      </div>

      <div className="paste-meta">
        <span>Views: {formatViews()}</span>

        <span>
          TTL:{" "}
          {meta === null
            ? "..."
            : meta.expires_at === null
            ? "∞"
            : timeLeft || "..."}
        </span>
      </div>
    </motion.a>
  );
}
