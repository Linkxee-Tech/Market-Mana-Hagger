import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Market-Mama — Your AI Bargaining Partner",
  description: "Realtime, intelligent bargaining coach and savings tracker for your shopping flow. Powered by Gemini Flash 2.0.",
};
import { AuthProvider } from "../components/AuthProvider";
import { GlobalProvider } from "../components/GlobalProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <GlobalProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GlobalProvider>
      </body>
    </html>
  );
}
