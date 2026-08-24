import type { Metadata } from "next";
import { Inter, Lora, Source_Code_Pro } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/common/theme-provider";
import { QueryProvider } from "@/components/common/query-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { SCHOOL_CONFIG } from "@/constants";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-heading",
});

const lora = Lora({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    siteName: APP_NAME,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: SCHOOL_CONFIG.favicon || "/favicon.ico",
    shortcut: SCHOOL_CONFIG.favicon || "/favicon.ico",
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
      suppressHydrationWarning
      className={cn(
        "antialiased",
        inter.variable,
        lora.variable,
        sourceCodePro.variable,
      )}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        suppressHydrationWarning
        className={cn(
          inter.variable,
          lora.variable,
          sourceCodePro.variable,
          "font-sans antialiased",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <NuqsAdapter>
              <TooltipProvider>
                <NextTopLoader />
                {children}
                <Toaster />
                <SonnerToaster
                  position="top-right"
                  richColors
                  closeButton
                  duration={2500}
                  visibleToasts={3}
                />
              </TooltipProvider>
            </NuqsAdapter>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
