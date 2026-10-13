import { createPageMetadata } from "@/app/[locale]/_lib/pageMetadata";
import { AccessibilitySettingsRedirect } from "./AccessibilitySettingsRedirect";

export const generateMetadata = createPageMetadata(
	"common.a11y.shell.pageTitle.accessibilitySettings",
);

export default function AccessibilitySettingsPage() {
	return <AccessibilitySettingsRedirect />;
}
