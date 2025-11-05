import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloProvider } from "@/lib/graphql/apollo-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Twitter Analytics Dashboard",
  description: "Neo4j-powered Twitter network analysis and visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ApolloProvider>{children}</ApolloProvider>
      </body>
    </html>
  );
}
