import MapInitializer from "@/components/Map/MapInitializer/MapInitializer";
import { Menu } from "@/components/Menu/Menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Kulturkataster",
	description: "Kulturkataster",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="de">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<SidebarProvider>
					<Menu />
					<SidebarInset className="flex-1 w-0">
						<div className="flex flex-1 flex-col gap-4 h-full w-full pb-20 md:pb-0">
							<MapInitializer />
							{children}
						</div>
					</SidebarInset>
				</SidebarProvider>
			</body>
		</html>
	);
}
