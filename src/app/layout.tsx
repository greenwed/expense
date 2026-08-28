import type { Metadata } from "next";
import "./globals.css";
import { GameProvider } from "@/context/GameContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Fish — Real-Time Virtual Aquarium",
  description:
    "Grow, manage, breed, and sell aquatic fish in real time. Continuous clock simulation, dynamic 2D canvas aquarium, breeding lab, and peer-to-peer marketplace.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🐠</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-cyan-500 selection:text-white">
        <GameProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <footer className="w-full border-t border-cyan-500/10 py-6 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <span>🐠 Fish Virtual Aquarium</span>
                <span className="text-slate-400 font-normal">
                  • Real-Time Clock Ecosystem Simulation
                </span>
              </div>
              <div className="text-slate-400">
                Ready for $0 Free Cloud Hosting & Custom Domain
              </div>
            </div>
          </footer>
        </GameProvider>
      </body>
    </html>
  );
}
