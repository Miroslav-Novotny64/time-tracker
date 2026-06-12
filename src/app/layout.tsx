import "@/styles/globals.css";

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "@/app/_components/theme-provider";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
	title: "Sledování času",
	description:
		"Jednoduchá aplikace pro sledování a správu času stráveného na projektech",
	icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-geist-sans",
});

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html className={`${geist.variable}`} lang="cs" suppressHydrationWarning>
			<body>
				<TRPCReactProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="dark"
						enableSystem={false}
					>
						{children}
					</ThemeProvider>
				</TRPCReactProvider>
			</body>
		</html>
	);
}
