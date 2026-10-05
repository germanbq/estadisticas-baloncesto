import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import Header from "../components/Header";

export const metadata: Metadata = {
  title: "Estadísticas de baloncesto",
  description: "",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className="h-full"
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider localization={esES}>
            <Header />
            {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
