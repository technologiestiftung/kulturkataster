import type { Metadata } from "next";
import { serverSideTranslation } from "@/i18n";

type MetadataProps = {
	params: Promise<{ locale: string }>;
};

/**
 * Builds a `generateMetadata` function that sets a localized page title.
 * By default the title is combined with the site-wide template from the
 * locale layout ("<title> – Berliner Kulturkataster"); pass `absolute: true` for
 * titles that already name the site.
 */
export function createPageMetadata(
	titleKey: string,
	options: { absolute?: boolean } = {},
) {
	return async function generateMetadata({
		params,
	}: MetadataProps): Promise<Metadata> {
		const { locale } = await params;
		const { t } = await serverSideTranslation(locale);
		const title = t(titleKey);
		return { title: options.absolute ? { absolute: title } : title };
	};
}
