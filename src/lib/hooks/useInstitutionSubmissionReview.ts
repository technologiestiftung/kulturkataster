"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getInstitutionById } from "@/server/actions/institutions";
import {
	getSubmissionById,
	reviewSubmission,
	saveSubmissionNote,
} from "@/server/actions/submissions";
import type { Institution } from "@/types/institution";
import type { InstitutionActionPermissions } from "@/types/account";
import type { Submission } from "@/types/submission";
import { canReviewInstitutionSubmissionType } from "@/lib/utils/submissionReviewPermissions";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";

type UseInstitutionSubmissionReviewParams = {
	submissionId?: number;
	submissions: Submission[];
	institutionPermissions: InstitutionActionPermissions;
	removeSubmission: (id: number) => void;
	upsertSubmission: (submission: Submission) => void;
};

export function useInstitutionSubmissionReview({
	submissionId,
	submissions,
	institutionPermissions,
	removeSubmission,
	upsertSubmission,
}: UseInstitutionSubmissionReviewParams) {
	const { t } = useTranslation("content");
	const hasSubmissionId = typeof submissionId === "number";
	const [internalNotes, setInternalNotes] = useState("");
	const [grantSubmitterAccess, setGrantSubmitterAccess] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fetchedSubmission, setFetchedSubmission] = useState<Submission | null>(
		null,
	);
	const [didFetchSubmission, setDidFetchSubmission] = useState(false);
	const [originalInstitution, setOriginalInstitution] =
		useState<Institution | null>(null);
	const [didFetchInstitution, setDidFetchInstitution] = useState(false);

	const resolvedSubmission = useMemo(() => {
		if (!hasSubmissionId) return undefined;
		return submissions.find(
			(item): item is Submission => item.id === submissionId,
		);
	}, [hasSubmissionId, submissions, submissionId]);

	useEffect(() => {
		if (!hasSubmissionId || resolvedSubmission || didFetchSubmission) return;
		let active = true;
		const fetchSubmission = async () => {
			try {
				const result = await getSubmissionById(submissionId);
				if (!active) return;
				setFetchedSubmission(result ?? null);
			} catch (_error) {
				reportClientTelemetry({
					level: "warn",
					event: "institution_submission.review.fetch_submission_failed",
					error: _error,
					metadata: {
						submission_id: submissionId,
					},
				});
				if (active) {
					setFetchedSubmission(null);
				}
			} finally {
				if (active) {
					setDidFetchSubmission(true);
				}
			}
		};
		void fetchSubmission();
		return () => {
			active = false;
		};
	}, [didFetchSubmission, hasSubmissionId, resolvedSubmission, submissionId]);

	const resolvedSubmissionWithFallback =
		resolvedSubmission ?? fetchedSubmission ?? undefined;

	const shouldShowGrantSubmitterAccessToggle = useMemo(() => {
		if (!resolvedSubmissionWithFallback) return false;
		if (resolvedSubmissionWithFallback.type !== "create") return false;
		const meta = resolvedSubmissionWithFallback.meta;
		if (!meta || typeof meta !== "object" || Array.isArray(meta)) return false;
		return (meta as Record<string, unknown>).request_claim_on_approval === true;
	}, [resolvedSubmissionWithFallback]);

	const canReviewCurrentSubmission = useMemo(() => {
		if (!resolvedSubmissionWithFallback) return false;
		return canReviewInstitutionSubmissionType(
			institutionPermissions,
			resolvedSubmissionWithFallback.type,
		);
	}, [institutionPermissions, resolvedSubmissionWithFallback]);

	useEffect(() => {
		const entityId = resolvedSubmissionWithFallback?.entity_id;
		if (
			typeof entityId !== "number" ||
			Number.isNaN(entityId) ||
			originalInstitution ||
			didFetchInstitution
		) {
			return;
		}
		let active = true;
		const fetchInstitution = async () => {
			try {
				const result = await getInstitutionById(entityId);
				if (!active) return;
				setOriginalInstitution(result ?? null);
			} catch (_error) {
				reportClientTelemetry({
					level: "warn",
					event: "institution_submission.review.fetch_institution_failed",
					error: _error,
					metadata: {
						submission_id: resolvedSubmissionWithFallback?.id,
						entity_id: entityId,
					},
				});
				if (active) {
					setOriginalInstitution(null);
				}
			} finally {
				if (active) {
					setDidFetchInstitution(true);
				}
			}
		};
		void fetchInstitution();
		return () => {
			active = false;
		};
	}, [
		didFetchInstitution,
		originalInstitution,
		resolvedSubmissionWithFallback?.id,
		resolvedSubmissionWithFallback?.entity_id,
	]);

	useEffect(() => {
		setGrantSubmitterAccess(false);
	}, [resolvedSubmissionWithFallback?.id]);

	const formatReviewError = (err: unknown) => {
		if (err instanceof Error && err.message) return err.message;
		if (typeof err === "string") return err;
		if (err && typeof err === "object") {
			const withMessage = err as {
				message?: unknown;
				error?: unknown;
				code?: unknown;
			};
			if (typeof withMessage.message === "string" && withMessage.message) {
				return withMessage.message;
			}
			if (typeof withMessage.error === "string" && withMessage.error) {
				return withMessage.error;
			}
			if (typeof withMessage.code === "string" && withMessage.code) {
				return withMessage.code;
			}
		}
		return t("institutionFormModal.review.errorUnknown");
	};

	const handleReview = useCallback(
		async (status: "approved" | "rejected"): Promise<boolean> => {
			if (!resolvedSubmissionWithFallback) return false;
			if (!canReviewCurrentSubmission) return false;
			if (submitting) return false;
			if (
				resolvedSubmissionWithFallback.type === "update" &&
				typeof resolvedSubmissionWithFallback.entity_id !== "number"
			) {
				setError(
					t("institutionFormModal.review.error", {
						error: "Update submission is missing institution id.",
					}),
				);
				return false;
			}
			setSubmitting(true);
			setError(null);
			try {
				const reviewed = await reviewSubmission({
					id: resolvedSubmissionWithFallback.id,
					status,
					internalNotes: internalNotes.trim()
						? internalNotes.trim()
						: undefined,
					grantSubmitterAccess: shouldShowGrantSubmitterAccessToggle
						? grantSubmitterAccess
						: undefined,
				});
				if (status === "approved") {
					removeSubmission(resolvedSubmissionWithFallback.id);
				} else if (reviewed && typeof reviewed === "object") {
					upsertSubmission(reviewed as Submission);
				}
				return true;
			} catch (err) {
				reportClientTelemetry({
					level: "error",
					event: "institution_submission.review.submit_failed",
					error: err,
					metadata: {
						submission_id: resolvedSubmissionWithFallback.id,
						submission_type: resolvedSubmissionWithFallback.type,
						entity_id: resolvedSubmissionWithFallback.entity_id,
						status,
					},
				});
				const errorMessage = formatReviewError(err);
				setError(
					t("institutionFormModal.review.error", {
						error: errorMessage,
					}),
				);
				return false;
			} finally {
				setSubmitting(false);
			}
		},
		[
			canReviewCurrentSubmission,
			formatReviewError,
			grantSubmitterAccess,
			internalNotes,
			removeSubmission,
			resolvedSubmissionWithFallback,
			shouldShowGrantSubmitterAccessToggle,
			submitting,
			t,
			upsertSubmission,
		],
	);

	const handleSaveNote = useCallback(async (): Promise<boolean> => {
		if (!resolvedSubmissionWithFallback) return false;
		if (!canReviewCurrentSubmission) return false;
		if (submitting) return false;

		const note = internalNotes.trim();
		if (!note) return false;

		setSubmitting(true);
		setError(null);
		try {
			const updatedSubmission = await saveSubmissionNote({
				submissionId: resolvedSubmissionWithFallback.id,
				note,
			});
			upsertSubmission(updatedSubmission as Submission);
			setInternalNotes("");
			return true;
		} catch (err) {
			reportClientTelemetry({
				level: "error",
				event: "institution_submission.review.save_note_failed",
				error: err,
				metadata: {
					submission_id: resolvedSubmissionWithFallback.id,
					submission_type: resolvedSubmissionWithFallback.type,
					entity_id: resolvedSubmissionWithFallback.entity_id,
				},
			});
			const errorMessage = formatReviewError(err);
			setError(
				t("institutionFormModal.review.error", {
					error: errorMessage,
				}),
			);
			return false;
		} finally {
			setSubmitting(false);
		}
	}, [
		canReviewCurrentSubmission,
		formatReviewError,
		internalNotes,
		resolvedSubmissionWithFallback,
		submitting,
		t,
		upsertSubmission,
	]);

	return {
		hasSubmissionId,
		resolvedSubmissionWithFallback,
		didFetchSubmission,
		originalInstitution,
		internalNotes,
		setInternalNotes,
		grantSubmitterAccess,
		setGrantSubmitterAccess,
		submitting,
		error,
		handleReview,
		handleSaveNote,
		shouldShowGrantSubmitterAccessToggle,
		canReviewCurrentSubmission,
	};
}
