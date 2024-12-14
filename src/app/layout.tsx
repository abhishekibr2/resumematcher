import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/provider/theme-provider";
import SessionWrapper from "@/provider/SessionWrapper";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionWrapper>

            <Toaster />
            {children}
          </SessionWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
