import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PasteCard from "./PasteCard.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";


function classify(meta) {
  const infiniteViews = meta.max_views === null;
  const infiniteTime = meta.expires_at === null;

  if (infiniteViews && infiniteTime) return "immortals";
  if (!infiniteViews && infiniteTime) return "watchlist";
  if (infiniteViews && !infiniteTime) return "timebombs";
  return "doomed";
}

function isSameGroups(a, b) {
  const keys = Object.keys(a);
  for (const k of keys) {
    if (a[k].length !== b[k].length) return false;
    for (let i = 0; i < a[k].length; i++) {
      if (a[k][i].id !== b[k][i].id) return false;
    }
  }
  return true;
}

export default function PasteGallery() {
  const [groups, setGroups] = useState({
    immortals: [],
    watchlist: [],
    timebombs: [],
    doomed: []
  });

  // only one open at a time
  const [open, setOpen] = useState("immortals");

  const prevGroups = useRef(groups);

  useEffect(() => {
    async function loadGallery() {
      const res = await fetch(`${API_BASE}/api/pastes`);
      if (!res.ok) return;
      let data = await res.json();
      data = [...data].reverse();

      const temp = {
        immortals: [],
        watchlist: [],
        timebombs: [],
        doomed: []
      };

      await Promise.all(
        data.map(async (paste) => {
          const r = await fetch(`${API_BASE}/api/pastes/${paste.id}/meta`);
          if (!r.ok) return;
          const meta = await r.json();
          const type = classify(meta);
          temp[type].push(paste);
        })
      );

      if (!isSameGroups(prevGroups.current, temp)) {
        prevGroups.current = temp;
        setGroups(temp);
      }
    }

    loadGallery();
    const interval = setInterval(loadGallery, 4000);
    return () => clearInterval(interval);
  }, []);
    function Section({ title, type, items }) {
      const isOpen = open === type;

      return (
        <motion.div
          className="accordion-section"
          layout
          transition={{ duration: 2, ease: "easeInOut" }}
          style={{
            flex: isOpen ? "4 1 0%" : "1 1 0%"
          }}
        >
          <button className="accordion-header" onClick={() => setOpen(type)}>
            <span>{title}</span>
            <span>{isOpen ? "−" : "+"}</span>
          </button>

          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                className="accordion-body"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {items.length === 0 && (
                  <p className="empty">No active pastes</p>
                )}
                {items.map((paste) => (
                  <PasteCard key={paste.id} paste={paste} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }

  return (
    <div className="gallery-flex">
      <Section title="Immortals" type="immortals" items={groups.immortals} />
      <Section title="Watchlist" type="watchlist" items={groups.watchlist} />
      <Section title="Timebombs" type="timebombs" items={groups.timebombs} />
      <Section title="Doomed" type="doomed" items={groups.doomed} />
    </div>
  );
}
