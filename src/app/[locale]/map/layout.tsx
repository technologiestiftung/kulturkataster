import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";
import { serverSideTranslation } from "@/i18n";

export const generateMetadata = createPageMetadata("common.map.title");

export default async function MapLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale);

	// The map itself renders outside this route (MapListShell); this gives
	// every /map view its own page heading.
	return (
		<>
			<h1 className="sr-only">{t("common.map.title")}</h1>
			{children}
		</>
	);
}
