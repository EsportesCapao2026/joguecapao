import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jogue Capão",
  description:
    "Portal esportivo de Capão da Canoa com campeonatos, inscrições, regras e painel administrativo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
