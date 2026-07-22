import type { Metadata } from "next";
// Use the local geist package instead of Google Fonts
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { PatientProvider } from "@/context/PatientContext";
import "./globals.css";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ThemeProvider } from "next-themes";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Patient Care Management System",
  description:
    "Patient management System built with Next.js, Prisma, and Tailwind CSS for healthcare providers to manage patient records, appointments, and treatments efficiently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <CurrencyProvider>
            <PatientProvider>
              {children}
              <Toaster />
              <SpeedInsights />
            </PatientProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
