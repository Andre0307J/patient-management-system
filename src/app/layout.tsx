import type { Metadata } from "next";
// Use the local geist package instead of Google Fonts
import { GeistMono } from "geist/font/mono";
import { Toaster } from "@/components/ui/sonner";
import { PatientProvider } from "@/context/PatientContext";
import "./globals.css";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ThemeProvider } from "next-themes";
import { HospitalProvider } from "@/context/HospitalContext";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Patient Care Management System",
  description:
    "Patient management System built with Next.js, Prisma, and Tailwind CSS for healthcare providers to manage patient records, appointments, and treatments efficiently.",
  icons: {
    icon: {
      url: "/pms-image.png",
      sizes: "any",
      type: "image/png",
    },
    shortcut: "/pms-image.png",
    apple: "/pms-image.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${GeistMono.variable} h-full antialiased`}
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
            <HospitalProvider>
              <PatientProvider>
                {children}
                <Toaster />
                <SpeedInsights />
              </PatientProvider>
            </HospitalProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
