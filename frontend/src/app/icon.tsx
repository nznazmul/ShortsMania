import { ImageResponse } from "next/og";

// Image metadata
export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

// Professional ShortsMania Favicon Generator
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #06b6d4 100%)",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(124, 58, 237, 0.5)",
        }}
      >
        {/* Stylized Play Symbol with Sparkle */}
        <svg
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Play Triangle */}
          <path
            d="M6 4.5V19.5L18 12L6 4.5Z"
            fill="white"
          />
          {/* AI Sparkle Star accent */}
          <path
            d="M17 3L18 6L21 7L18 8L17 11L16 8L13 7L16 6L17 3Z"
            fill="#FFD700"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
