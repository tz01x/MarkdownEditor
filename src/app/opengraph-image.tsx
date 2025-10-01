import { ImageResponse } from "next/og";

// Image metadata
export const alt = "Markdown Editor - Free Online Editor with Live Preview";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px",
          }}
        >
          <div
            style={{
              fontSize: 90,
              fontWeight: "bold",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            📝 Markdown Editor
          </div>
          <div
            style={{
              fontSize: 36,
              opacity: 0.9,
              textAlign: "center",
              maxWidth: "800px",
            }}
          >
            Free Online Editor with Live Preview, PDF Export & Dark Mode
          </div>
          <div
            style={{
              fontSize: 28,
              marginTop: "40px",
              opacity: 0.8,
              display: "flex",
              gap: "30px",
            }}
          >
            <span>✨ Live Preview</span>
            <span>📄 PDF Export</span>
            <span>🌙 Dark Mode</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
