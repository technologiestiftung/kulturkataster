import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { downloadQuestionnaireAnswersMock } = vi.hoisted(() => ({
	downloadQuestionnaireAnswersMock: vi.fn(),
}));

vi.mock("@/server/actions/questionnaires", () => ({
	downloadQuestionnaireAnswers: downloadQuestionnaireAnswersMock,
	downloadAllQuestionnaireAnswers: vi.fn(),
}));

import { downloadInstitutionQuestionnaireAnswers } from "@/lib/utils/questionnaireAnswersDownloadUtils";

const makeRow = (questionLabel: string, config: unknown, value: unknown) => ({
	questionLabel,
	step: 0,
	fieldType: "radio",
	config,
	value,
	answeredAt: new Date("2026-10-08T00:00:00Z"),
});

describe("downloadInstitutionQuestionnaireAnswers free-text options", () => {
	let blobArg: { text: () => Promise<string> } | null;
	let OriginalBlob: typeof Blob;

	beforeEach(() => {
		downloadQuestionnaireAnswersMock.mockReset();
		blobArg = null;
		OriginalBlob = globalThis.Blob;

		class MockBlob {
			private content: string;

			constructor(parts: unknown[]) {
				this.content = parts.map((part) => String(part)).join("");
			}

			async text() {
				return this.content;
			}
		}

		// @ts-expect-error - test-only blob shim
		globalThis.Blob = MockBlob;

		URL.createObjectURL = vi.fn((blob: Blob | MediaSource) => {
			if ("text" in blob) {
				blobArg = blob;
			}
			return "blob:test";
		});
		URL.revokeObjectURL = vi.fn();

		HTMLAnchorElement.prototype.click = vi.fn();
	});

	afterEach(() => {
		globalThis.Blob = OriginalBlob;
	});

	it("joins a colon-terminated option label and its free text with a single colon", async () => {
		downloadQuestionnaireAnswersMock.mockResolvedValue({
			ok: true,
			data: {
				institutionName: "Alpha",
				metaData: null,
				rows: [
					makeRow(
						"Nutzung",
						{
							options: [{ value: "theater", label: "Theater" }],
							freeTextOption: { value: "other", label: "Sonstiges:" },
						},
						{ selected: "other", freeText: "Zirkus" },
					),
					makeRow(
						"Bauvorhaben",
						{
							options: [
								{ value: "no", label: "Nein" },
								{ value: "yes", label: "Ja, folgende:" },
							],
							freeTextOption: { value: "yes" },
						},
						{ selected: "yes", freeText: "Neubau" },
					),
				],
			},
		});

		const result = await downloadInstitutionQuestionnaireAnswers({
			institutionId: 1,
			filenameBase: "alpha",
			format: "csv",
		});

		expect(result).toEqual({ ok: true });
		const csv = (await blobArg?.text()) ?? "";
		expect(csv).toContain('"Sonstiges: Zirkus"');
		expect(csv).toContain('"Ja, folgende: Neubau"');
		expect(csv).not.toContain("::");
	});
});
