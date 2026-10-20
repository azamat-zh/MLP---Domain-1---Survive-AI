import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillCast — A weather forecast for your career in the AI era",
  description:
    "Tracks live job-market signals (Remotive, Arbeitnow), predicts rising and declining skills, matches you to future roles with explainable scores, builds personalised reskilling pathways, and maps every role to the UN SDGs. Aiversecity Future-Ready Workforce POC.",
  keywords: [
    "SkillCast",
    "AI reskilling",
    "future of work",
    "SDG 4",
    "career forecast",
    "Aiversecity",
    "skills radar",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "SkillCast — career weather forecast",
    description: "Live skills radar · explainable matching · SDG ledger · two futures, not one guess.",
    siteName: "SkillCast POC",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Dark-first product: default dark, light always one click away */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
