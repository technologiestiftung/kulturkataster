import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InstitutionImportFeedback } from "@/components/Modals/Pages/InstitutionImportFeedback";

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
				result={{ ok: true, created: 2, updated: 5, unchanged: 40 }}
			/>,
		);

		expect(screen.getByRole("status")).toHaveTextContent(
			"5 Orte aktualisiert, 2 Orte neu angelegt, 40 unverändert.",
		);
	});

	it("lists row and column of validation errors", () => {
		render(
			<InstitutionImportFeedback
				result={{
					ok: false,
					error: "validationFailed",
					issueCount: 3,
					issues: [
						{ row: 4, column: "Kapazität", code: "invalidNumber" },
						{ row: 7, column: "Kultureinrichtung", code: "emptyRequired" },
					],
				}}
			/>,
		);

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent(
			"Zeile 4, Spalte „Kapazität“: invalidNumber",
		);
		expect(alert).toHaveTextContent(
			"Zeile 7, Spalte „Kultureinrichtung“: emptyRequired",
		);
		expect(alert).toHaveTextContent("… und 1 weitere Fehler.");
	});
});
