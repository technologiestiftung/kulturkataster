import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InstitutionImportFeedback } from "@/components/Modals/Pages/InstitutionImportFeedback";

vi.mock("@/icons/check-circle.svg", () => ({ default: () => null }));
vi.mock("@/icons/warning.svg", () => ({ default: () => null }));

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) => {
			const template = String(options?.defaultValue ?? key);
			return template.replace(/{{(\w+)}}/g, (_, name: string) =>
				String(options?.[name] ?? ""),
			);
		},
	}),
}));

describe("InstitutionImportFeedback", () => {
	it("shows the number of updated and created places after a successful import", () => {
		render(
			<InstitutionImportFeedback
				result={{
					ok: true,
					dryRun: false,
					created: 2,
					updated: 5,
					unchanged: 40,
				}}
			/>,
		);

		expect(screen.getByRole("status")).toHaveTextContent(
			"5 Orte aktualisiert, 2 Orte neu angelegt, 40 unverändert.",
		);
	});

	it("states that a dry run has not saved anything yet", () => {
		render(
			<InstitutionImportFeedback
				result={{
					ok: true,
					dryRun: true,
					created: 1,
					updated: 3,
					unchanged: 10,
				}}
			/>,
		);

		const status = screen.getByRole("status");
		expect(status).toHaveTextContent("Prüfung erfolgreich");
		expect(status).toHaveTextContent(
			"Beim Import werden 3 Orte aktualisiert und 1 Orte neu angelegt, 10 bleiben unverändert. Es wurde noch nichts gespeichert.",
		);
	});

	it("groups identical problems and lists their rows", () => {
		render(
			<InstitutionImportFeedback
				result={{
					ok: false,
					error: "validationFailed",
					issueCount: 5,
					issues: [
						{ row: 4, column: "Kapazität", code: "invalidNumber" },
						{ row: 7, column: "Tags", code: "unknownTag", values: ["Jazz"] },
						{
							row: 8,
							column: "Tags",
							code: "unknownTag",
							values: ["Jazz", "Folk"],
						},
						{ row: 1551, column: "Tags", code: "unknownTag", values: ["Jazz"] },
					],
				}}
			/>,
		);

		const items = within(screen.getByRole("alert")).getAllByRole("listitem");
		expect(items.map((item) => item.textContent)).toEqual([
			"Spalte „Kapazität“: invalidNumber (Zeilen 4)",
			"Spalte „Tags“: unknownTag „Jazz“ (Zeilen 7–8, 1551)",
			"Spalte „Tags“: unknownTag „Folk“ (Zeilen 8)",
		]);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"… und 1 weitere Fehler.",
		);
	});
});
