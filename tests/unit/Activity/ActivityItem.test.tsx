import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivityItem } from "@/components/Activity/ActivityItem";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		className,
	}: {
		href: string;
		children: React.ReactNode;
		className?: string;
	}) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}));

vi.mock("@/components/ui/tooltip", () => ({
	Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	TooltipContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

const translations: Record<string, string> = {
	"common.auth.account.activity.templates.create":
		"{{actor}} hat {{primaryEntity}} {{action}}",
	"common.auth.account.activity.system": "System",
	"common.auth.account.activity.unknown": "Unbekannt",
};

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { defaultValue?: string; status?: string }) =>
			translations[key] ?? options?.defaultValue ?? key,
		i18n: { resolvedLanguage: "de" },
	}),
	Trans: ({
		i18nKey,
		defaults,
		values,
	}: {
		i18nKey: string;
		defaults?: string;
		values?: Record<string, string>;
	}) => {
		const template = translations[i18nKey] ?? defaults ?? "";
		const text = Object.entries(values ?? {}).reduce(
			(result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
			template,
		);
		return <>{text.replace(/<\/?[^>]+>/g, "")}</>;
	},
}));

describe("ActivityItem", () => {
	it("renders create/update messages with the translated perfect-tense template", () => {
		render(
			<ActivityItem
				index={0}
				activity={{
					date: "2026-06-01T15:06:00.000Z",
					user: null,
					actor: "Lina Rippel",
					primaryEntity: "Kulturort #636: Stadtteilbibliothek Mahlsdorf",
					action: "aktualisiert",
					status: "completed",
				}}
			/>,
		);

		expect(screen.getByText(/Lina Rippel hat/)).toBeInTheDocument();
		expect(screen.getByText(/Kulturort #636/)).toBeInTheDocument();
		expect(screen.getByText(/aktualisiert/)).toBeInTheDocument();
	});
});
