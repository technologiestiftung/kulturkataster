"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { InstitutionReview } from "@/components/Institution/InstitutionReview";
import { institutionSubmissionToDraft } from "@/lib/utils/institutionSubmissionUtils";
import { useAccountStore } from "@/lib/store/accountStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useInstitutionSubmissionReview } from "@/lib/hooks/useInstitutionSubmissionReview";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { formatUserDisplayName } from "@/lib/utils/userName";
import { formatDateWithLocale } from "@/lib/utils/dateUtils";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelectModal } from "@/components/MultiSelect/MultiSelectModal";
import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";

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
	const { t: tEnum } = useTranslation("enumMap");
	const { i18n } = useTranslation();
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const closeModal = useRoutedModalClose({ returnTo });
	const [reviewError, setReviewError] = useState<string | null>(null);

	const allSubmissions = useAccountStore((state) => state.submissions);
	const institutionPermissions = useAccountStore(
		(state) => state.institutionPermissions,
	);
	const allUsers = useAccountStore((state) => state.users);
	const allGroups = useAccountStore((state) => state.groups);
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

	const {
		hasSubmissionId,
		resolvedSubmissionWithFallback,
		didFetchSubmission,
		originalInstitution,
		internalNotes,
		setInternalNotes,
		grantSubmitterAccess,
		setGrantSubmitterAccess,
		attachUserIds,
		setAttachUserIds,
		attachGroupIds,
		setAttachGroupIds,
		submitting,
		error,
		handleReview,
		handleSaveNote,
		shouldShowGrantSubmitterAccessToggle,
		canReviewCurrentSubmission,
	} = useInstitutionSubmissionReview({
		submissionId,
		submissions,
		institutionPermissions,
		removeSubmission,
		upsertSubmission,
	});
	const shouldAutoCloseMissingSubmission =
		!hasSubmissionId || (didFetchSubmission && !resolvedSubmissionWithFallback);
	useEffect(() => {
		if (!shouldAutoCloseMissingSubmission) return;
		closeModal();
	}, [shouldAutoCloseMissingSubmission, closeModal]);
	const handleReviewAction = useCallback(
		async (status: "approved" | "rejected") => {
			if (!resolvedSubmissionWithFallback) return;
			const success = await handleReview(status);
			if (!success) {
				setReviewError(
					error ?? t("institutionFormModal.review.errorDescription"),
				);
				return;
			}
			closeModal();
			triggerAccountRefresh(
				status === "approved"
					? ["submissions", "institutions", "users", "groups", "entityAudits"]
					: ["submissions", "entityAudits"],
			);
			showSuccessToast(
				status === "approved"
					? t("institutionFormModal.review.success.approve.title")
					: t("institutionFormModal.review.success.reject.title"),
				status === "approved"
					? t("institutionFormModal.review.success.approve.description")
					: t("institutionFormModal.review.success.reject.description"),
			);
			if (shouldRefresh) {
				queueMicrotask(() => router.refresh());
			}
		},
		[
			closeModal,
			error,
			handleReview,
			resolvedSubmissionWithFallback,
			router,
			shouldRefresh,
			t,
		],
	);

	const handleSaveNoteAction = useCallback(async () => {
		if (!resolvedSubmissionWithFallback) return;
		const success = await handleSaveNote();
		if (!success) {
			setReviewError(
				error ?? t("institutionFormModal.review.errorDescription"),
			);
			return;
		}
		triggerAccountRefresh(["submissions", "entityAudits"]);
		showSuccessToast(
			t("institutionFormModal.review.success.saveNotes.title"),
			t("institutionFormModal.review.success.saveNotes.description"),
		);
	}, [error, handleSaveNote, resolvedSubmissionWithFallback, t]);

	const userOptions = useMemo(
		() =>
			allUsers.map((user) => ({
				value: user.id,
				label: formatUserDisplayName(user) ?? user.email,
				searchText: `${formatUserDisplayName(user) ?? ""} ${user.email}`,
			})),
		[allUsers],
	);

	const groupOptions = useMemo(
		() =>
			allGroups.map((group) => ({
				value: String(group.id),
				label: group.name,
				searchText: group.name,
			})),
		[allGroups],
	);

	if (shouldAutoCloseMissingSubmission) return null;
	if (!resolvedSubmissionWithFallback) {
		return null;
	}

	const draft = institutionSubmissionToDraft(resolvedSubmissionWithFallback);
	const submissionStatus = resolvedSubmissionWithFallback.status;
	const submissionStatusLabel = (() => {
		if (!submissionStatus) return "";
		const key = `submission_status.${submissionStatus}`;
		const translated = tEnum(key);
		return translated === key ? submissionStatus : translated;
	})();
	const submissionTypeLabel = t(
		`institutionsTable.type.submissionBase.${resolvedSubmissionWithFallback.type}`,
		{
			defaultValue: resolvedSubmissionWithFallback.type,
		},
	);
	const submissionTitle =
		submissionStatus === "approved" ||
		submissionStatus === "rejected" ||
		submissionStatus === "needs_changes"
			? t(`institutionsTable.type.submissionStatus.${submissionStatus}`, {
					type: submissionTypeLabel,
					defaultValue: submissionTypeLabel,
				})
			: t(
					`institutionsTable.type.submission.${resolvedSubmissionWithFallback.type}`,
					{
						defaultValue: resolvedSubmissionWithFallback.type,
					},
				);

	return (
		<Modal
			title={submissionTitle}
			variant="fullscreen"
			returnTo={returnTo}
			routePath={routePath}
			closeConfirmation={{
				title: t("institutionModalCloseConfirmation.title"),
				description: t("institutionModalCloseConfirmation.description"),
				confirmLabel: t("institutionModalCloseConfirmation.confirm"),
				cancelLabel: t("institutionModalCloseConfirmation.cancel"),
			}}
			errorDialog={
				reviewError
					? {
							open: true,
							title: t("institutionFormModal.review.errorTitle"),
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
				<InstitutionReview
					data={originalInstitution ?? draft}
					newData={originalInstitution ? draft : undefined}
					onEditSection={(sectionId) => {
						router.push(
							toLocalePath(`${editBasePath}/${submissionId}/edit#${sectionId}`),
						);
					}}
				/>
				{canReviewCurrentSubmission && (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<span className="body2">
								{t("institutionFormModal.review.notesLabel")}
							</span>
							{submissionStatus && (
								<span className="body2">
									{t("institutionFormModal.review.statusLabel", {
										status: submissionStatusLabel,
									})}
								</span>
							)}
						</div>
						<>
							{resolvedSubmissionWithFallback.notes?.length ? (
								<div className="space-y-2">
									<div className="body2 ">
										{t("institutionFormModal.review.previousNotesLabel")}
									</div>
									<div className="space-y-2">
										{resolvedSubmissionWithFallback.notes.map((note) => (
											<Card key={note.id} variant="tertiary">
												<CardContent variant="tertiary" className="p-3">
													<div className="body3 whitespace-pre-wrap">
														{note.note}
													</div>
													<div className="mt-2 body3 text-muted-foreground">
														{t("institutionFormModal.review.noteMeta", {
															defaultValue: "{{author}} am {{date}}",
															author:
																formatUserDisplayName(note.creator) ??
																note.creator?.email ??
																t("auth.account.activity.system", {
																	defaultValue: "System",
																}),
															date: formatDateWithLocale(note.created_at, {
																locale: i18n.language,
																format: {
																	dateStyle: "medium",
																	timeStyle: "short",
																},
															}),
														})}
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								</div>
							) : null}
							<Textarea
								value={internalNotes}
								onChange={(event) => setInternalNotes(event.target.value)}
								placeholder={t("institutionFormModal.review.notesPlaceholder")}
								rows={4}
								disabled={submitting}
							/>
							{shouldShowGrantSubmitterAccessToggle ? (
								<label className="flex items-start gap-3">
									<Checkbox
										checked={grantSubmitterAccess}
										onCheckedChange={(checked) =>
											setGrantSubmitterAccess(checked === true)
										}
										disabled={submitting}
									/>
									<span className="body2">
										{t("institutionFormModal.review.grantSubmitterAccess")}
									</span>
								</label>
							) : null}
							{(userOptions.length > 0 || groupOptions.length > 0) && (
								<div className="space-y-3">
									<span className="body2">
										{t("institutionFormModal.review.attachOnApproval")}
									</span>
									<div className="flex flex-col gap-3">
										{userOptions.length > 0 && (
											<div className="flex-1">
												<MultiSelectModal
													title={t(
														"institutionFormModal.review.attachUsers.title",
													)}
													placeholder={t(
														"institutionFormModal.review.attachUsers.placeholder",
													)}
													searchPlaceholder={t(
														"institutionFormModal.review.attachUsers.searchPlaceholder",
													)}
													options={userOptions}
													selected={attachUserIds}
													onChange={setAttachUserIds}
													disabled={submitting}
												/>
											</div>
										)}
										{groupOptions.length > 0 && (
											<div className="flex-1">
												<MultiSelectModal
													title={t(
														"institutionFormModal.review.attachGroups.title",
													)}
													placeholder={t(
														"institutionFormModal.review.attachGroups.placeholder",
													)}
													searchPlaceholder={t(
														"institutionFormModal.review.attachGroups.searchPlaceholder",
													)}
													options={groupOptions}
													selected={attachGroupIds.map(String)}
													onChange={(ids) => setAttachGroupIds(ids.map(Number))}
													disabled={submitting}
												/>
											</div>
										)}
									</div>
								</div>
							)}
							<div className="flex items-center justify-end gap-3">
								<Button
									type="button"
									variant="destructive"
									onClick={() => void handleReviewAction("rejected")}
									disabled={submitting}
								>
									{t("institutionFormModal.review.actions.reject")}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => void handleSaveNoteAction()}
									disabled={submitting || internalNotes.trim().length === 0}
								>
									{t("institutionFormModal.review.actions.saveNotes", {
										defaultValue: "Save notes",
									})}
								</Button>
								<Button
									type="button"
									onClick={() => void handleReviewAction("approved")}
									disabled={submitting}
								>
									{t("institutionFormModal.review.actions.approve")}
								</Button>
							</div>
						</>
					</div>
				)}
			</div>
		</Modal>
	);
}
