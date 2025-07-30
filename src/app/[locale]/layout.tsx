import MapInitializer from "@/components/Map/MapInitializer/MapInitializer";
import type { Metadata } from "next";
import "./globals.css";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Menu } from "@/components/Menu/Menu";
import { Locale } from "@/types";
import { getDirection } from "@/lib/utils";
import I18NProvider from "@/i18n/i18n-provider";
import { serverSideTranslation } from "@/i18n";

export const metadata: Metadata = {
	title: "Kulturkataster",
	description: "Kulturkataster",
};

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: Locale }>;
}>) {
	const { locale } = await params;
	const ns: string[] = ["common", "content"]; // namespace used for this page
	const { resources } = await serverSideTranslation(locale, ns);

	return (
		<html lang={locale} dir={getDirection(locale)}>
			<body className={` antialiased`}>
				<I18NProvider locale={locale} namespaces={ns} resources={resources}>
					<SidebarProvider>
						<Menu />
						<SidebarInset className="flex-1 w-0">
							<div className="flex flex-1 flex-col gap-4 h-full w-full pb-20 md:pb-0">
								<MapInitializer />
								{children}
							</div>
						</SidebarInset>
					</SidebarProvider>
				</I18NProvider>
			</body>
		</html>
	);
}
