import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PanelKit",
  description: "VS Code styled API Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* VS Code Title Bar */}
        <div className="panelkit-titlebar">
          <span>PanelKit - API Dashboard</span>
        </div>
        
        {children}
      </body>
    </html>
  );
}