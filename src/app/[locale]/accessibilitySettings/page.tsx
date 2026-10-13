import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";
import { serverSideTranslation } from "@/i18n";
import { AccessibilitySettingsRedirect } from "./AccessibilitySettingsRedirect";

const titleKey = "common.a11y.shell.pageTitle.accessibilitySettings";

export const generateMetadata = createPageMetadata(titleKey);

export default async function AccessibilitySettingsPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale);

	return (
		<>
			<h1 className="sr-only">{t(titleKey)}</h1>
			<AccessibilitySettingsRedirect />
		</>
	);
}
