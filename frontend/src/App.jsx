import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import PastePage from "./pages/PastePage.jsx";

export default function App() {
  return (
    <div className="layout">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/p/:id" element={<PastePage />} />
      </Routes>
    </div>
  );
}