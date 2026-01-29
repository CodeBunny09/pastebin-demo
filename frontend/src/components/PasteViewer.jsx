import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";


export default function PasteViewer({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return; // prevent double fetch in StrictMode
    loaded.current = true;

    async function load() {
      const res = await fetch(`${API_BASE}/api/pastes/${id}`);
      if (!res.ok) {
        setError("Paste not found or expired");
        return;
      }
      const json = await res.json();
      setData(json);

      if (json.expires_at) {
        const expireMs = new Date(json.expires_at).getTime();

        const updateCountdown = () => {
          const diff = expireMs - Date.now();
          if (diff <= 0) setTimeLeft("Expired");
          else setTimeLeft(Math.ceil(diff / 1000) + "s");
        };

        updateCountdown();
        const i = setInterval(updateCountdown, 1000);
        return () => clearInterval(i);
      }
    }

    load();
  }, [id]);

  if (error) return <h3>{error}</h3>;
  if (!data) return <h3>Loading...</h3>;

  return (
    <div className="viewer">
      <h2>View Paste</h2>
      <pre>{data.content}</pre>
      <p>Remaining views: {data.remaining_views ?? "∞"}</p>
      <p>Expires in: {data.expires_at ? timeLeft : "Never"}</p>
    </div>
  );
}
