import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { collection, addDoc, getDocs } from "firebase/firestore";
import L from "leaflet";
import { db } from "./firebase";
import { buildSkylineUrl } from "./utils/skyline";
import type { Camera } from "./types";

export default function App() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selected, setSelected] = useState<Camera | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // 🧭 Firestoreから履歴読み込み
  useEffect(() => {
    async function fetchHistory() {
      const querySnapshot = await getDocs(collection(db, "cameras"));
      const loaded: Camera[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Camera;
        loaded.push(data);
      });
      setCameras(loaded);
      console.log("📜 履歴を読み込みました:", loaded);
    }
    // fetchHistory();
  }, []);

  // 🎙 音声入力
  async function handleVoiceCommand() {
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "ja-JP";

    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      console.log("🎙️ 認識結果:", text);

      if (text.includes("パリ")) addCamera("パリ", 48.8566, 2.3522);
      else if (text.includes("東京")) addCamera("東京", 35.6895, 139.6917);
      else if (text.includes("ローマ")) addCamera("ローマ", 41.9028, 12.4964);
      else if (text.includes("ニューヨーク"))
        addCamera("ニューヨーク", 40.7128, -74.006);
      else if (text.includes("ハワイ")) addCamera("ハワイ", 21.3069, -157.8583);
      else alert("対応する地名が見つかりません。");
    };

    recognition.start();
  }

  // 🆕 カメラ追加
  async function addCamera(name: string, lat: number, lng: number) {
    const url = buildSkylineUrl(name.toLowerCase());
    const newCam = { name, lat, lng, url };
    setCameras((prev) => [...prev, newCam]);
    setSelected(newCam);
    await addDoc(collection(db, "cameras"), newCam);
  }

  // 💾 評価とメモを保存
  async function saveRating(rating: number, memo: string) {
    if (!selected) return;
    const updated = { ...selected, rating, memo };
    await addDoc(collection(db, "cameras"), updated);
    setSelected(updated);
    alert("履歴に保存しました✨");
  }

  // ⭐ マーカー色を評価ごとに変える
  function getMarkerColor(rating?: number): string {
    if (rating === undefined) return "blue";
    if (rating <= 2) return "gray";
    if (rating === 3) return "orange";
    if (rating >= 4) return "green";
    return "blue";
  }

  // Leafletカスタムアイコン
  function makeIcon(color: string) {
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="
        background-color:${color};
        width:16px;
        height:16px;
        border-radius:50%;
        border:2px solid white;
      "></div>`,
    });
  }

  // 👇 MapContainer のすぐ上あたりに追加
  function ResizeMapOnShow({ show }: { show: boolean }) {
    const map = useMap();
    useEffect(() => {
      if (show) {
        setTimeout(() => {
          map.invalidateSize();
        }, 500);
      }
    }, [show]);
    return null;
  }

  return (
    <div
      className="fullscreen"
      style={{
        position: "relative",
        backgroundColor: "#f0ede6",
      }}
      onClick={() => !showMenu && setShowMenu(true)}
    >
      {/* 🎥 映像 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: showMap ? "50%" : "100%",
          border: "16px solid #b68e68",
          borderRadius: "12px",
          overflow: "hidden",
          boxSizing: "border-box",
          transition: "height 0.4s ease",
        }}
      >
        {selected ? (
          <iframe
            width="100%"
            height="100%"
            src={selected.url}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={selected.name}
          />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "#666",
            }}
          >
            音声で地名を言ってください
          </div>
        )}
      </div>

      {/* 🗺️ 地図 */}
      {showMap && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "50%",
          }}
        >
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "100%", width: "100%" }}
          >
            <ResizeMapOnShow show={showMap} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            {cameras.map((c, i) => (
              <Marker
                key={i}
                position={[c.lat, c.lng]}
                eventHandlers={{ click: () => setSelected(c) }}
                icon={makeIcon(getMarkerColor(c.rating))}
              >
                <Popup>
                  <b>{c.name}</b>
                  {c.rating && <div>評価: {c.rating} ⭐</div>}
                  {c.memo && <div>{c.memo}</div>}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* 🎙️ 音声ボタン */}
      <button
        onClick={handleVoiceCommand}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "10px 20px",
          borderRadius: "10px",
          backgroundColor: "#b68e68",
          color: "white",
          border: "none",
          fontSize: "1.1rem",
          zIndex: 10,
        }}
      >
        🎙 音声で地名を言う
      </button>

      {/* 📋 メニュー */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: showMenu ? 0 : "-250px",
          width: "250px",
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.95)",
          boxShadow: "-4px 0 10px rgba(0,0,0,0.2)",
          transition: "right 0.4s ease",
          padding: "20px",
          zIndex: 20,
        }}
      >
        <button
          onClick={() => setShowMenu(false)}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            position: "absolute",
            top: 10,
            right: 10,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h3 style={{ marginTop: 40, color: "#444" }}>メニュー</h3>
        <button
          onClick={() => setShowMap((prev) => !prev)}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#b68e68",
            color: "white",
            border: "none",
            borderRadius: "6px",
            marginTop: "10px",
          }}
        >
          {showMap ? "地図を隠す" : "地図を表示"}
        </button>

        {selected && (
          <div style={{ marginTop: "20px" }}>
            <h4>{selected.name} の評価</h4>
            <div>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() =>
                    saveRating(
                      n,
                      prompt("メモ（任意）を入力してください") || ""
                    )
                  }
                  style={{
                    margin: "2px",
                    fontSize: "1.2rem",
                    background: selected.rating === n ? "#b68e68" : "#ddd",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    width: "32px",
                    height: "32px",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 📱 メニューを開くバー */}
      {!showMenu && (
        <div
          onClick={() => setShowMenu(true)}
          style={{
            position: "absolute",
            top: "50%",
            right: 0,
            width: "30px",
            height: "60px",
            backgroundColor: "#b68e68",
            borderTopLeftRadius: "10px",
            borderBottomLeftRadius: "10px",
            cursor: "pointer",
          }}
        />
      )}
    </div>
  );
}
