import Footer from "@/components/Footer/Footer";
import MapInitializer from "@/components/Map/MapInitializer/MapInitializer";
import { Menu } from "@/components/Menu/Menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { serverSideTranslation } from "@/i18n";
import I18NProvider from "@/i18n/i18n-provider";
import { getDirection } from "@/lib/utils";
import { Locale } from "@/types";
import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const barlow = Barlow({
	preload: true,
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800", "900"],
	variable: "--font-barlow",
});

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
	const ns: string[] = ["common", "content", "enumMap"]; // namespace used for this page
	const { resources } = await serverSideTranslation(locale, ns);

	return (
		<html lang={locale} dir={getDirection(locale)}>
			<body className={`${barlow.className} antialiased`}>
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

					<Footer />
				</I18NProvider>

				<Script id="matomo" strategy="afterInteractive">
					{`
            var _paq = window._paq = window._paq || [];
            _paq.push(['disableCookies']);
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (function() {
              var u="//kulturraeume.berlin/matomo/";
              _paq.push(['setTrackerUrl', u+'matomo.php']);
              _paq.push(['setSiteId', '3']);
              var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
              g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
            })();
          `}
				</Script>
			</body>
		</html>
	);
}
