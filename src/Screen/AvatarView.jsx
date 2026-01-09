import { useState, useRef, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import Experience from "../components/Experience";
import { MdFullscreen, MdCloseFullscreen, MdVolumeUp } from "react-icons/md";

function AvatarView() {
  const [text, setText] = useState("");
  const [speak, setSpeak] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const containerRef = useRef(null);

  const height = useMemo(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    return width < 768 ? `${Math.round(height * 0.68)}px` : `${Math.round(width * 0.3)}px`;
  }, [isFullScreen]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current
        ?.requestFullscreen?.()
        .then(() => setIsFullScreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullScreen(false));
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  return (
    <div
      style={{
        height: "97vh",
        width: "99vw",
        backgroundColor: "#2d2d2d",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: height,
          transition: "all 0.3s ease",
          backgroundColor: "#2d2d2d",
          borderRadius: isFullScreen ? "0" : "15px",
          overflow: "hidden",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <button
          onClick={toggleFullScreen}
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            color: "white",
            border: "none",
            cursor: "pointer",
            zIndex: 10,
            borderRadius: "50%",
            width: "35px",
            height: "35px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) =>
            (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.4)")
          }
          onMouseLeave={(e) =>
            (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
          }
          title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullScreen ? (
            <MdCloseFullscreen size={25} />
          ) : (
            <MdFullscreen size={25} />
          )}
        </button>

        <Canvas
          shadows
          camera={{ position: [0, 0, 10], fov: 20 }}
          style={{
            height: "100%",
            width: "100%",
            transition: "all 0.3s ease",
          }}
        >
          <color attach="background" args={["#2d2d2d"]} />
          <Experience speakingText={text} speak={speak} setSpeak={setSpeak} />
        </Canvas>
      </div>

      {!isFullScreen && (
        <div
          style={{
            width: "100%",
            height: "20vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "10px 20px",
            backgroundColor: "rgba(45, 45, 45, 0.9)",
            boxSizing: "border-box",
          }}
        >
          <textarea
            rows={4}
            value={text}
            placeholder="Type something..."
            style={{
              padding: "10px",
              width: "70%",
              borderRadius: "10px",
              border: "1px solid #555",
              resize: "none",
              fontSize: "16px",
              backgroundColor: "#1e1e1e",
              color: "#fff",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              boxSizing: "border-box",
            }}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={() => {
              setSpeak(true);
            }}
            style={{
              marginLeft: "10px",
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#45a049")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#4CAF50")}
          >
            <MdVolumeUp size={20} style={{ marginRight: "8px" }} />
            Speak
          </button>
        </div>
      )}
    </div>
  );
}

export default AvatarView;
