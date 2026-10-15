/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QuestionnaireAnswerRelinkPanel } from "@/components/Institution/QuestionnaireAnswerRelinkPanel";
import { searchInstitutions } from "@/server/actions/institutions";
import {
	getLinkedQuestionnaireAnswersCount,
	relinkQuestionnaireAnswers,
} from "@/server/actions/questionnaires";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string, options?: Record<string, unknown>) => {
			const template = (options?.defaultValue as string) ?? key;
			return template.replace(/{{(\w+)}}/g, (_match, name) =>
				String(options?.[name] ?? ""),
			);
		},
	}),
}));

vi.mock("@/server/actions/institutions", () => ({
	searchInstitutions: vi.fn(),
}));

vi.mock("@/server/actions/questionnaires", () => ({
	getLinkedQuestionnaireAnswersCount: vi.fn(),
	relinkQuestionnaireAnswers: vi.fn(),
}));

vi.mock("@/components/Search/LocationSearch", () => ({
	LocationSearch: ({
		onQueryChange,
	}: {
		onQueryChange?: (query: string) => void;
	}) => <input onChange={(e) => onQueryChange?.(e.target.value)} />,
}));

describe("QuestionnaireAnswerRelinkPanel", () => {
	beforeEach(() => {
		vi.mocked(getLinkedQuestionnaireAnswersCount).mockReset();
		vi.mocked(relinkQuestionnaireAnswers).mockReset();
		vi.mocked(searchInstitutions).mockReset();
	});

	it("renders nothing when no answers are linked", async () => {
		vi.mocked(getLinkedQuestionnaireAnswersCount).mockResolvedValue({
			ok: true,
			count: 0,
		});

		const { container } = render(
			<QuestionnaireAnswerRelinkPanel submissionId={9} />,
		);
		await Promise.resolve();

		expect(container).toBeEmptyDOMElement();
	});

	it("shows the linked answer count and re-links to a picked institution", async () => {
		vi.mocked(getLinkedQuestionnaireAnswersCount).mockResolvedValue({
			ok: true,
			count: 3,
		});
		vi.mocked(searchInstitutions).mockResolvedValue([
			{ id: 42, name: "Other Institution" } as any,
		]);
		vi.mocked(relinkQuestionnaireAnswers).mockResolvedValue({
			ok: true,
			count: 3,
		});

		render(<QuestionnaireAnswerRelinkPanel submissionId={9} />);

		await screen.findByText(/3 Fragebogen-Antworten/);
		fireEvent.click(screen.getByText("Verknüpfung ändern"));

		const input = document.querySelector("input") as HTMLInputElement;
		fireEvent.change(input, { target: { value: "Other" } });
		const option = await screen.findByText("Other Institution");
		fireEvent.click(option);

		fireEvent.click(screen.getByText("Speichern"));
		await Promise.resolve();
		await Promise.resolve();

		expect(relinkQuestionnaireAnswers).toHaveBeenCalledWith({
			fromSubmissionId: 9,
			toInstitutionId: 42,
		});
	});
});
