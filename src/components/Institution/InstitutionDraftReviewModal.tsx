"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Modal } from "@/components/Modals/Modal";
import { InstitutionReview } from "@/components/Institution/InstitutionReview";
import { institutionSubmissionToDraft } from "@/lib/utils/institutionSubmissionUtils";
import { useAccountStore } from "@/lib/store/accountStore";
import {
	getSubmissionById,
	reviewSubmission,
} from "@/server/actions/submissions";
import { getInstitutionById } from "@/server/actions/institutions";
import type { Submission } from "@/types/submission";
import type { Institution } from "@/types/institution";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

type InstitutionDraftReviewModalProps = {
	submissionId?: number;
	returnTo?: string;
	editBasePath?: string;
	routePath?: string;
	shouldRefresh?: boolean;
};

export function InstitutionDraftReviewModal({
	submissionId,
	returnTo,
	editBasePath = "/account/submissions",
	routePath,
	shouldRefresh = false,
}: InstitutionDraftReviewModalProps) {
	const { t } = useTranslation("content");
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const [reviewNotes, setReviewNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const hasSubmissionId = typeof submissionId === "number";
	const allSubmissions = useAccountStore((state) => state.submissions);
	const upsertSubmission = useAccountStore((state) => state.upsertSubmission);
	const removeSubmission = useAccountStore((state) => state.removeSubmission);
	const submissions = useMemo(
		() =>
			allSubmissions.filter(
				(s) =>
					s.entity_type === "institution" &&
					(s.type === "create" || s.type === "update"),
			),
		[allSubmissions],
	);
	const [fetchedSubmission, setFetchedSubmission] = useState<Submission | null>(
		null,
	);
	const [didFetchSubmission, setDidFetchSubmission] = useState(false);
	const [originalInstitution, setOriginalInstitution] =
		useState<Institution | null>(null);
	const [didFetchInstitution, setDidFetchInstitution] = useState(false);

	const resolvedSubmission = useMemo(() => {
		if (!hasSubmissionId) return undefined;
		return (
			submissions.find(
				(item: Submission): item is Submission => item.id === submissionId,
			) ?? undefined
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
			} catch {
				if (active) {
					setFetchedSubmission(null);
				}
			} finally {
				if (active) {
					setDidFetchSubmission(true);
				}
			}
		};
		fetchSubmission();
		return () => {
			active = false;
		};
	}, [didFetchSubmission, hasSubmissionId, resolvedSubmission, submissionId]);

	const resolvedSubmissionWithFallback =
		resolvedSubmission ?? fetchedSubmission ?? undefined;

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
			} catch {
				if (active) {
					setOriginalInstitution(null);
				}
			} finally {
				if (active) {
					setDidFetchInstitution(true);
				}
			}
		};
		fetchInstitution();
		return () => {
			active = false;
		};
	}, [
		didFetchInstitution,
		originalInstitution,
		resolvedSubmissionWithFallback?.entity_id,
	]);

	useEffect(() => {
		if (!resolvedSubmissionWithFallback || reviewNotes) return;
		const existingNotes =
			typeof resolvedSubmissionWithFallback.review_notes === "string"
				? resolvedSubmissionWithFallback.review_notes
				: "";
		if (existingNotes) {
			setReviewNotes(existingNotes);
		}
	}, [resolvedSubmissionWithFallback, reviewNotes]);

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
		async (status: "approved" | "rejected") => {
			if (!resolvedSubmissionWithFallback) return;
			if (submitting) return;
			setSubmitting(true);
			setError(null);
			try {
				const reviewed = await reviewSubmission({
					id: resolvedSubmissionWithFallback.id,
					status,
					reviewNotes: reviewNotes.trim() ? reviewNotes.trim() : undefined,
				});
				if (status === "approved") {
					removeSubmission(resolvedSubmissionWithFallback.id);
				} else if (reviewed && typeof reviewed === "object") {
					upsertSubmission(reviewed as Submission);
				}
				if (shouldRefresh) {
					router.refresh();
				}
				if (returnTo) {
					router.replace(toLocalePath(returnTo));
				}
			} catch (err) {
				console.error(
					"Failed to review submission:",
					resolvedSubmissionWithFallback.id,
					err,
				);
				const errorMessage = formatReviewError(err);
				setError(
					t("institutionFormModal.review.error", {
						error: errorMessage,
					}),
				);
			} finally {
				setSubmitting(false);
			}
		},
		[
			formatReviewError,
			submitting,
			resolvedSubmissionWithFallback?.id,
			reviewNotes,
			router,
			returnTo,
			shouldRefresh,
			t,
			removeSubmission,
			toLocalePath,
			upsertSubmission,
		],
	);

	if (!hasSubmissionId) {
		return (
			<AlertDialog
				status="error"
				title={t("institutionFormModal.dialog.notFound.title")}
				description={t("institutionFormModal.dialog.notFound.description")}
			/>
		);
	}

	if (!resolvedSubmissionWithFallback) {
		if (!didFetchSubmission) return null;
		return (
			<AlertDialog
				status="error"
				title={t("institutionFormModal.dialog.notFound.title")}
				description={t("institutionFormModal.dialog.notFound.description")}
			/>
		);
	}

	const draft = institutionSubmissionToDraft(resolvedSubmissionWithFallback);
	const submissionStatus = resolvedSubmissionWithFallback.status;

	return (
		<Modal
			title={t("institutionFormModal.review.title")}
			variant="fullscreen"
			returnTo={returnTo}
			routePath={routePath}
			closeConfirmation={{
				title: t("institutionModalCloseConfirmation.title"),
				description: t("institutionModalCloseConfirmation.description"),
				confirmLabel: t("institutionModalCloseConfirmation.confirm"),
				cancelLabel: t("institutionModalCloseConfirmation.cancel"),
			}}
			content={
				<div className="space-y-6">
					<InstitutionReview
						data={originalInstitution ?? draft}
						newData={originalInstitution ? draft : undefined}
						onEditSection={(sectionId) => {
							router.push(
								toLocalePath(
									`${editBasePath}/${submissionId}/edit#${sectionId}`,
								),
							);
						}}
					/>
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="body2">
								{t("institutionFormModal.review.notesLabel")}
							</span>
							{submissionStatus && (
								<span className="body2 text-muted-foreground">
									{t("institutionFormModal.review.statusLabel", {
										status: submissionStatus,
									})}
								</span>
							)}
						</div>
						<Textarea
							value={reviewNotes}
							onChange={(event) => setReviewNotes(event.target.value)}
							placeholder={t("institutionFormModal.review.notesPlaceholder")}
							rows={4}
						/>
						{error && <p className="body2 text-destructive">{error}</p>}
						<div className="flex items-center justify-end gap-3">
							<Button
								type="button"
								variant="destructive"
								onClick={() => void handleReview("rejected")}
								disabled={submitting}
							>
								{t("institutionFormModal.review.actions.reject")}
							</Button>
							<Button
								type="button"
								onClick={() => void handleReview("approved")}
								disabled={submitting}
							>
								{t("institutionFormModal.review.actions.approve")}
							</Button>
						</div>
					</div>
				</div>
			}
		/>
	);
}
