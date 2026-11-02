import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
	downloadQuestionnaireAnswersMock,
	downloadAllQuestionnaireAnswersMock,
} = vi.hoisted(() => ({
	downloadQuestionnaireAnswersMock: vi.fn(),
	downloadAllQuestionnaireAnswersMock: vi.fn(),
}));

vi.mock("@/server/actions/questionnaires", () => ({
	downloadQuestionnaireAnswers: downloadQuestionnaireAnswersMock,
	downloadAllQuestionnaireAnswers: downloadAllQuestionnaireAnswersMock,
}));

import {
	downloadInstitutionQuestionnaireAnswers,
	downloadInstitutionQuestionnaireAnswersAll,
} from "@/lib/utils/questionnaireAnswersDownloadUtils";

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
					makeRow(
						"Digitale Kanäle",
						{
							options: [
								{ value: "website", label: "Eigene Webseite" },
								{ value: "newsletter", label: "Newsletter" },
							],
							freeTextOption: { value: "other", label: "Sonstiges:" },
						},
						{ selected: ["website", "other"], freeText: "Podcast" },
					),
					makeRow(
						"Datenerhebung",
						{
							options: [{ value: "survey", label: "Umfragen" }],
							freeTextOption: { value: "other", label: "Sonstiges:" },
						},
						{ selected: ["other", "survey"], freeText: "Zählung" },
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
		expect(csv).toContain('"Eigene Webseite; Sonstiges: Podcast"');
		expect(csv).toContain('"Sonstiges: Zählung; Umfragen"');
		expect(csv).not.toContain("::");
	});

	it("marks places that only exist as a pending submission in the status column", async () => {
		downloadAllQuestionnaireAnswersMock.mockResolvedValue({
			ok: true,
			data: {
				metaData: null,
				questions: [
					{ id: 10, label: "Miete", step: 0, fieldType: "text", config: null },
				],
				institutions: [
					{
						id: 2,
						name: "Archiv der Jugendkulturen",
						isPendingSubmission: true,
						answeredAt: new Date("2026-10-08T00:00:00Z"),
						answers: { 10: "800" },
					},
					{
						id: 2,
						name: "Zebra Kulturhaus",
						isPendingSubmission: false,
						answeredAt: new Date("2026-10-08T00:00:00Z"),
						answers: { 10: "1200" },
					},
				],
			},
		});

		const result = await downloadInstitutionQuestionnaireAnswersAll({
			filenameBase: "all",
			format: "csv",
		});

		expect(result).toEqual({ ok: true });
		const lines = ((await blobArg?.text()) ?? "").split("\r\n");
		expect(lines[1]).toBe('"","Beantwortet am","Status","Miete"');
		expect(lines[2]).toBe(
			'"Archiv der Jugendkulturen","08.10.2026","Neu eingereicht (noch nicht in Kuka)","800"',
		);
		expect(lines[3]).toBe('"Zebra Kulturhaus","08.10.2026","In Kuka","1200"');
	});
});
