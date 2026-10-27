import StatsDataNotice from "../components/StatsDataNotice";
import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "Estadísticas de baloncesto",
  description: "Demo educativa de estadísticas de baloncesto con datos ficticios, para portfolio y sin monetización.",
  icons: {
    icon: "/logo.webp",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className="h-full"
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider localization={esES}>
            <Header />
            <aside aria-label="Información de la demostración" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-[#80613a] bg-[#1f1c18] px-4 py-2 text-sm text-[#ffd59a]">
                <span>Demo educativa · Sin monetización</span>
                <StatsDataNotice context="Esta demostración" />
            </aside>
            <div className="flex-1 min-w-0">{children}</div>
            <Footer />
        </ClerkProvider>
      </body>
    </html>
  );
}
