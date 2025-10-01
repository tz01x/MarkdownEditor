import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PreferencesProvider } from "@/contexts/PreferencesContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://markdown-editor-indol.vercel.app"),
  title: {
    default: "Markdown Editor - Free Online Markdown Editor with Live Preview",
    template: "%s | Markdown Editor",
  },
  description:
    "Free online markdown editor with live preview, PDF export, syntax highlighting, and dark mode. Create, edit, and export markdown files with ease. No installation required.",
  keywords: [
    "markdown editor",
    "online markdown editor",
    "free markdown editor",
    "markdown live preview",
    "markdown to pdf",
    "markdown syntax highlighting",
    "markdown converter",
    "markdown writer",
    "text editor",
    "markdown preview",
    "export markdown",
    "markdown tools",
    "online text editor",
    "code editor",
    "documentation editor",
  ],
  authors: [{ name: "tumzied" }],
  creator: "tumzied",
  publisher: "tumzied",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://markdown-editor-indol.vercel.app",
    title: "Markdown Editor - Free Online Markdown Editor with Live Preview",
    description:
      "Free online markdown editor with live preview, PDF export, syntax highlighting, and dark mode. Create, edit, and export markdown files with ease.",
    siteName: "Markdown Editor",
    images: [
      {
        url: "/og-image.png", // You'll need to create this image
        width: 1200,
        height: 630,
        alt: "Markdown Editor Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markdown Editor - Free Online Markdown Editor with Live Preview",
    description:
      "Free online markdown editor with live preview, PDF export, syntax highlighting, and dark mode.",
    images: ["/og-image.png"], // You'll need to create this image
    creator: "@ar_tumzied",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://markdown-editor-indol.vercel.app",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Markdown Editor",
    description:
      "Free online markdown editor with live preview, PDF export, syntax highlighting, and dark mode.",
    url: "https://markdown-editor-indol.vercel.app",
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "Live Preview",
      "PDF Export",
      "Syntax Highlighting",
      "Dark Mode",
      "Auto-save",
      "File Management",
      "Drag and Drop",
      "Table of Contents",
      "Word Count",
      "Fullscreen Mode",
    ],
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    softwareVersion: "1.0.0",
    author: {
      "@type": "Person",
      name: "tumzied",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <PreferencesProvider>{children}</PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
