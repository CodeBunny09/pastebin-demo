import { useParams } from "react-router-dom";
import PasteViewer from "../components/PasteViewer.jsx";
import PasteGallery from "../components/PasteGallery.jsx";

export default function PastePage() {
  const { id } = useParams();

  return (
    <>
      {/* LEFT — creator / viewer */}
      <div className="input-panel">
        <PasteViewer id={id} />
      </div>

      {/* RIGHT — gallery */}
      <div className="gallery-panel">
        <h3>Live Gallery</h3>
        <PasteGallery />
      </div>
    </>
  );
}
