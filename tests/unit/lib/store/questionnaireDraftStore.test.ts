import { beforeEach, describe, expect, it } from "vitest";
import { useQuestionnaireDraftStore } from "@/lib/store/questionnaireDraftStore";

describe("questionnaireDraftStore", () => {
	beforeEach(() => {
		useQuestionnaireDraftStore.getState().reset();
	});

	it("clears submissionId when institutionId is set", () => {
		const { setSubmissionId, setInstitutionId } =
			useQuestionnaireDraftStore.getState();

		setSubmissionId(7);
		expect(useQuestionnaireDraftStore.getState().submissionId).toBe(7);

		setInstitutionId(5);
		expect(useQuestionnaireDraftStore.getState().institutionId).toBe(5);
		expect(useQuestionnaireDraftStore.getState().submissionId).toBeNull();
	});

	it("clears institutionId when submissionId is set", () => {
		const { setSubmissionId, setInstitutionId } =
			useQuestionnaireDraftStore.getState();

		setInstitutionId(5);
		expect(useQuestionnaireDraftStore.getState().institutionId).toBe(5);

		setSubmissionId(7);
		expect(useQuestionnaireDraftStore.getState().submissionId).toBe(7);
		expect(useQuestionnaireDraftStore.getState().institutionId).toBeNull();
	});

	it("clears both institutionId and submissionId when a different questionnaire loads", () => {
		const { ensureQuestionnaire, setSubmissionId } =
			useQuestionnaireDraftStore.getState();

		ensureQuestionnaire(1);
		setSubmissionId(7);
		expect(useQuestionnaireDraftStore.getState().submissionId).toBe(7);

		ensureQuestionnaire(2);
		expect(useQuestionnaireDraftStore.getState().submissionId).toBeNull();
		expect(useQuestionnaireDraftStore.getState().institutionId).toBeNull();
	});
});
