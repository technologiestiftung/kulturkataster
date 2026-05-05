"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/Modals/Modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useAccountStore } from "@/lib/store/accountStore";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { reviewSubmission } from "@/server/actions/submissions";
import type { Submission } from "@/types/submission";
import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";
import { InfoItem } from "@/components/InfoWrapper/InfoItem";
import { formatUserDisplayName } from "@/lib/utils/userName";

type CategorySubmissionReviewModalProps = {
	submission: Submission;
	returnTo?: string;
	routePath?: string;
	shouldRefresh?: boolean;
};

const asRecord = (value: unknown): Record<string, unknown> =>
	value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};

const getCategoryKey = (submission: Submission) => {
	const data = asRecord(submission.data);
	return typeof data.key === "string" ? data.key : "";
};

const getLinkedInstitutionSubmissionId = (submission: Submission) => {
	const meta = asRecord(submission.meta);
	const value = meta.institutionSubmissionId;
	return typeof value === "number" && Number.isFinite(value) ? value : null;
};

export function CategorySubmissionReviewModal({
	submission,
	returnTo,
	routePath,
	shouldRefresh = false,
}: CategorySubmissionReviewModalProps) {
	const { t } = useTranslation("content");
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const removeSubmission = useAccountStore((state) => state.removeSubmission);
	const upsertSubmission = useAccountStore((state) => state.upsertSubmission);
	const institutionPermissions = useAccountStore(
		(state) => state.institutionPermissions,
	);
	const [internalNotes, setInternalNotes] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [reviewError, setReviewError] = useState<string | null>(null);

	const categoryKey = getCategoryKey(submission);
	const linkedInstitutionSubmissionId =
		getLinkedInstitutionSubmissionId(submission);
	const linkedInstitutionSubmission = useAccountStore((state) =>
		linkedInstitutionSubmissionId
			? state.submissions.find(
					(item) => item.id === linkedInstitutionSubmissionId,
				)
			: undefined,
	);

	const title = t("categorySubmissionReview.title", {
		defaultValue: "Kategorie-Vorschlag prüfen",
	});
	const canManageCategorySubmission =
		institutionPermissions.create || institutionPermissions.update;

	const linkedInstitutionName = useMemo(() => {
		const data = asRecord(linkedInstitutionSubmission?.data);
		return typeof data.name === "string" && data.name.trim().length > 0
			? data.name
			: null;
	}, [linkedInstitutionSubmission]);
	const requesterLabel =
		formatUserDisplayName(submission.creator) ??
		submission.creator?.email ??
		submission.created_by ??
		"—";

	const handleReview = useCallback(
		async (status: "approved" | "rejected") => {
			if (submitting || !canManageCategorySubmission) return;
			setSubmitting(true);
			setReviewError(null);
			try {
				const result = await reviewSubmission({
					id: submission.id,
					status,
					internalNotes,
				});
				if (status === "approved") {
					removeSubmission(submission.id);
				} else if ("id" in result) {
					upsertSubmission(result as Submission);
				}
				triggerAccountRefresh(
					status === "approved"
						? ["submissions", "categories", "entityAudits"]
						: ["submissions", "entityAudits"],
				);
				showSuccessToast(
					status === "approved"
						? t("categorySubmissionReview.success.approve.title", {
								defaultValue: "Kategorie angelegt",
							})
						: t("categorySubmissionReview.success.reject.title", {
								defaultValue: "Kategorie-Vorschlag abgelehnt",
							}),
					status === "approved"
						? t("categorySubmissionReview.success.approve.description", {
								defaultValue: "Der Kategorie-Vorschlag wurde übernommen.",
							})
						: t("categorySubmissionReview.success.reject.description", {
								defaultValue: "Der Kategorie-Vorschlag wurde abgelehnt.",
							}),
				);
				if (shouldRefresh) {
					queueMicrotask(() => router.refresh());
				}
				router.replace(toLocalePath(returnTo ?? "/account/institutions"));
			} catch (error) {
				setReviewError(
					error instanceof Error
						? error.message
						: t("categorySubmissionReview.error.description", {
								defaultValue:
									"Der Kategorie-Vorschlag konnte nicht geprüft werden.",
							}),
				);
			} finally {
				setSubmitting(false);
			}
		},
		[
			internalNotes,
			removeSubmission,
			returnTo,
			router,
			shouldRefresh,
			submission.id,
			submitting,
			t,
			toLocalePath,
			upsertSubmission,
			canManageCategorySubmission,
		],
	);

	return (
		<Modal
			title={title}
			variant="fullscreen"
			returnTo={returnTo}
			routePath={routePath}
			errorDialog={
				reviewError
					? {
							open: true,
							title: t("categorySubmissionReview.error.title"),
							description: reviewError,
							confirmLabel: t("close"),
							onConfirm: () => setReviewError(null),
							onOpenChange: (open) => {
								if (!open) setReviewError(null);
							},
						}
					: undefined
			}
		>
			<div className="space-y-6">
				<Card variant="tertiary">
					<CardContent variant="tertiary" className="space-y-4 p-4">
						<InfoItem
							label={t("categorySubmissionReview.fields.key", {
								defaultValue: "Vorgeschlagene Kategorie",
							})}
							alwaysShow
						>
							{categoryKey || "—"}
						</InfoItem>
					</CardContent>
				</Card>
				<div className="space-y-4">
					<InfoItem
						label={t("institutionFormModal.review.requestedBy", {
							defaultValue: "Requested by",
						})}
						alwaysShow
					>
						{requesterLabel}
					</InfoItem>
					<InfoItem
						label={t("categorySubmissionReview.fields.linkedInstitution", {
							defaultValue: "Verknüpfte Kulturort-Einreichung",
						})}
						alwaysShow
					>
						{linkedInstitutionSubmissionId ? (
							<Button
								type="button"
								variant="tertiary"
								size="inline"
								className="underline"
								onClick={() =>
									router.push(
										toLocalePath(
											`/account/submissions/${linkedInstitutionSubmissionId}`,
										),
									)
								}
							>
								{linkedInstitutionName ??
									t("categorySubmissionReview.linkedSubmission", {
										defaultValue: `Einreichung #${linkedInstitutionSubmissionId}`,
									})}
							</Button>
						) : (
							"—"
						)}
					</InfoItem>
				</div>
				{canManageCategorySubmission ? (
					<>
						<div className="space-y-2">
							<label className="body2" htmlFor="category-review-notes">
								{t("categorySubmissionReview.notesLabel", {
									defaultValue: "Interne Notizen",
								})}
							</label>
							<Textarea
								id="category-review-notes"
								value={internalNotes}
								onChange={(event) => setInternalNotes(event.target.value)}
								rows={4}
								disabled={submitting}
							/>
						</div>

						<div className="flex flex-wrap gap-3">
							<Button
								type="button"
								variant="outline"
								disabled={submitting}
								onClick={() => void handleReview("rejected")}
							>
								{t("categorySubmissionReview.actions.reject", {
									defaultValue: "Ablehnen",
								})}
							</Button>
							<Button
								type="button"
								disabled={submitting}
								onClick={() => void handleReview("approved")}
							>
								{t("categorySubmissionReview.actions.approve", {
									defaultValue: "Annehmen",
								})}
							</Button>
						</div>
					</>
				) : null}
			</div>
		</Modal>
	);
}
