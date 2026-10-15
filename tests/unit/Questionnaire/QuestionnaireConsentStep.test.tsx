import { cloneElement, type ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuestionnaireConsentStep } from "@/components/Questionnaire/QuestionnaireConsentStep";

// Mirrors what react-i18next's real <Trans> does for this codebase's positional
// "<0>...</0>" tag convention (see AboutModal/InstitutionDraftIntroModal), so the
// resulting DOM structure — which components/renderField wrap which text — is
// actually exercised, not just the raw translation key.
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) =>
			(options?.defaultValue as string) ?? key,
	}),
	Trans: ({
		defaults,
		components,
	}: {
		i18nKey: string;
		defaults: string;
		components: ReactElement[];
	}) => {
		const parts = defaults.split(/(<\d+>.*?<\/\d+>)/g);
		return (
			<>
				{parts.map((part, index) => {
					const match = part.match(/^<(\d+)>(.*)<\/\1>$/);
					if (!match) return part;
					const [, componentIndex, text] = match;
					return cloneElement(
						components[Number(componentIndex)],
						{ key: index },
						text,
					);
				})}
			</>
		);
	},
}));

describe("QuestionnaireConsentStep", () => {
	it("bolds both the term and the quoted definition in paragraph2", () => {
		render(
			<QuestionnaireConsentStep
				consentGiven={false}
				onConsentChange={vi.fn()}
				onNext={vi.fn()}
			/>,
		);

		expect(
			screen.getByText("Kultureinrichtungen", { selector: "strong" }),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"„dauerhaft oder wiederkehrend genutzte Orte und Organisationen kultureller Produktion, Präsentation, Vermittlung oder Begegnung“",
				{ selector: "strong" },
			),
		).toBeInTheDocument();
	});

	it("bolds the duration in paragraph3", () => {
		render(
			<QuestionnaireConsentStep
				consentGiven={false}
				onConsentChange={vi.fn()}
				onNext={vi.fn()}
			/>,
		);

		expect(
			screen.getByText("etwa 15 bis 20 Minuten.", { selector: "strong" }),
		).toBeInTheDocument();
	});

	it("bolds the voluntary-participation sentence in paragraph6", () => {
		render(
			<QuestionnaireConsentStep
				consentGiven={false}
				onConsentChange={vi.fn()}
				onNext={vi.fn()}
			/>,
		);

		expect(
			screen.getByText("Die Teilnahme an der Befragung ist freiwillig.", {
				selector: "strong",
			}),
		).toBeInTheDocument();
	});
});
