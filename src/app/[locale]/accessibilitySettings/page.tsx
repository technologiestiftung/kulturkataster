import type { Metadata } from "next";
import { AccessibilitySettingsRedirect } from "./AccessibilitySettingsRedirect";

export const metadata: Metadata = {
	title: "Einstellungen zur Barrierefreiheit – Kulturkataster",
};

export default function AccessibilitySettingsPage() {
	return <AccessibilitySettingsRedirect />;
}
