// app/layout.js
import "./globals.css";

export const metadata = {
  title: "PulseHUD AI",
  description: "Minimal sports coach HUD"
};

export default function RootLayout({ children }) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  );
}
