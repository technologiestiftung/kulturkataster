import { AppPersistenceProvider } from "@/components/AppPersistenceProvider";
import Footer from "@/components/Footer/Footer";
import { MapListShell } from "@/components/Map/MapListShell";
import { Menu } from "@/components/Menu/Menu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { serverSideTranslation } from "@/i18n";
import I18NProvider from "@/i18n/i18n-provider";
import { getDirection } from "@/lib/utils/i18nDirection";
import { Locale } from "@/types";
import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { StoreInitializer } from "@/components/StoreInitializer";
import { StoreAutoRefresh } from "@/components/StoreAutoRefresh";
import { ViewModeToggle } from "@/components/Menu/ViewModeToggle";
import { Toaster } from "@/components/ui/sonner";

// Initialize axe-core for accessibility testing in development
// Commented out until @axe-core/react is installed
// if (process.env.NODE_ENV !== "production") {
// 	import("react")
// 		.then((React) => {
// 			import("react-dom")
// 				.then((ReactDOM) => {
// 					import("@axe-core/react")
// 						.then((axe) => {
// 							axe.default(React, ReactDOM, 1000);
// 						})
// 						.catch(() => {
// 							// axe-core not installed, skip accessibility testing
// 						});
// 				})
// 				.catch(() => {
// 					// react-dom not available
// 				});
// 		})
// 		.catch(() => {
// 			// react not available
// 		});
// }

const barlow = Barlow({
	preload: true,
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800", "900"],
	variable: "--font-barlow",
});

export const metadata: Metadata = {
	title: "Berliner Kulturkataster – Karte & Daten zu Kulturorten",
	description:
		"Die Seite macht Berlins Kulturlandschaft sichtbar: Kulturorte finden, filtern und erkunden – für Planung, Forschung und Öffentlichkeit. Ein Projekt der Kulturraum Berlin gGmbH.",
};

export default async function RootLayout({
	children,
	modal,
	sidebar,
	params,
}: Readonly<{
	children: React.ReactNode;
	modal: React.ReactNode;
	sidebar: React.ReactNode;
	params: Promise<{ locale: Locale }>;
}>) {
	const { locale } = await params;
	const ns: string[] = ["common", "content", "enumMap"]; // namespace used for this page
	const { resources } = await serverSideTranslation(locale, ns);
	const localizedResources = resources as Record<
		string,
		Record<string, Record<string, unknown>>
	>;
	const localeResources = localizedResources?.[locale] ?? {};
	const commonResources = (localeResources.common ?? {}) as Record<
		string,
		unknown
	>;

	const skipToContentLabel =
		typeof commonResources.skipToContent === "string"
			? (commonResources.skipToContent as string)
			: "Skip to main content";
	const mainContentLabel =
		typeof commonResources.mainContent === "string"
			? (commonResources.mainContent as string)
			: "Main content";
	const siteHeading =
		typeof commonResources.siteTitle === "string"
			? (commonResources.siteTitle as string)
			: "Berliner Kulturkataster";
	const headerLabel =
		typeof commonResources.headerLandmark === "string"
			? (commonResources.headerLandmark as string)
			: "Site header";
	const footerLabel =
		typeof commonResources.footerLandmark === "string"
			? (commonResources.footerLandmark as string)
			: "Footer";
	const supabaseUrl = process.env.SUPABASE_URL ?? "";
	const envHint = supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")
		? "local"
		: undefined;
	const shouldLoadMatomo = envHint !== "local";

	return (
		<html lang={locale} dir={getDirection(locale)}>
			<body className={`${barlow.className} antialiased`}>
				<I18NProvider locale={locale} namespaces={ns} resources={resources}>
					<AppPersistenceProvider />
					<StoreInitializer />
					<StoreAutoRefresh />
					<a
						href="#main-content"
						className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:bg-background focus:text-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg tab-ring"
					>
						{skipToContentLabel}
					</a>
					<div className="flex min-h-dvh flex-col">
						<SidebarProvider>
							<div className="flex min-h-0 flex-1 w-full">
								<header
									aria-label={headerLabel}
									className="flex-shrink-0 w-auto"
								>
									<Menu sidebar={sidebar} />
								</header>
								<SidebarInset asChild className="min-h-0 flex-1 w-0">
									<main
										id="main-content"
										className="min-h-0 focus:outline-none"
										tabIndex={-1}
										aria-label={mainContentLabel}
									>
										<h1 className="sr-only">{siteHeading}</h1>
										<div className="flex min-h-0 flex-1 flex-col">
											<MapListShell />
											{children}
										</div>
									</main>
								</SidebarInset>
							</div>
						</SidebarProvider>
						<ViewModeToggle />
						<Footer ariaLabel={footerLabel} envHint={envHint} />
					</div>
					<Toaster />
					{modal}
				</I18NProvider>

				{shouldLoadMatomo ? (
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
				) : null}
			</body>
		</html>
	);
}
