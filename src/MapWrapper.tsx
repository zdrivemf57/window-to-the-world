import { useMap, MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import type { Camera } from "./types";

function MapWrapper({
  show,
  cameras,
  setSelected,
}: {
  show: boolean;
  cameras: Camera[];
  setSelected: (c: Camera) => void;
}) {
  const [ready, setReady] = useState(false);

  // Leaflet再描画補正
  function ResizeMap() {
    const map = useMap();
    useEffect(() => {
      if (show) {
        setTimeout(() => {
          map.invalidateSize();
        }, 300);
      }
    }, [show]);
    return null;
  }

  // マップ初期化を少し遅延（iOSで高さ確定を待つ）
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <div style={{ height: "100%", background: "#ddd" }} />;

  return (
    <MapContainer center={[20, 0]} zoom={2} style={{ height: "100%", width: "100%" }}>
      <ResizeMap />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      {cameras.map((c, i) => (
        <Marker
          key={i}
          position={[c.lat, c.lng]}
          eventHandlers={{ click: () => setSelected(c) }}
          icon={L.divIcon({
            className: "custom-marker",
            html: `<div style="
              background-color: blue;
              width:16px;
              height:16px;
              border-radius:50%;
              border:2px solid white;
            "></div>`,
          })}
        >
          <Popup>
            <b>{c.name}</b>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
