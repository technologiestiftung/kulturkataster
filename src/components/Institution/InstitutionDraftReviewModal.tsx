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
import type { Submission } from "@/types/submission";
import { formatUserDisplayName } from "@/lib/utils/userName";
import { formatDateWithLocale } from "@/lib/utils/dateUtils";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelectModal } from "@/components/MultiSelect/MultiSelectModal";
import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";
import { InfoItem } from "@/components/InfoWrapper/InfoItem";
import { QuestionnaireAnswerRelinkPanel } from "@/components/Institution/QuestionnaireAnswerRelinkPanel";
import { getSubmissionDecisionEmailTemplateOptions } from "@/server/actions/submissions";
import {
	APPROVAL_EMAIL_TEMPLATES,
	type ApprovalSubmitterEmailTemplate,
	getDecisionEmailTemplatePath,
	pickAvailableTemplate,
	REJECTION_EMAIL_TEMPLATES,
	type RejectionSubmitterEmailTemplate,
	SubmissionDecisionEmailPanel,
	type VisibleSubmitterEmailTemplate,
} from "@/components/Institution/SubmissionDecisionEmailPanel";

type InstitutionDraftReviewModalProps = {
	submissionId?: number;
	submission?: Submission | null;
	didResolveSubmission?: boolean;
	returnTo?: string;
	editBasePath?: string;
	routePath?: string;
	shouldRefresh?: boolean;
};

export function InstitutionDraftReviewModal({
	submissionId,
	submission,
	didResolveSubmission = false,
	returnTo,
	editBasePath = "/account/submissions",
	routePath,
	shouldRefresh = false,
}: InstitutionDraftReviewModalProps) {
	const { t } = useTranslation();
	const { t: tEnum } = useTranslation();
	const { i18n } = useTranslation();
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const closeModal = useRoutedModalClose({ returnTo });
	const [reviewError, setReviewError] = useState<string | null>(null);
	const [notifySubmitter, setNotifySubmitter] = useState(true);
	const [approvalEmailTemplate, setApprovalEmailTemplate] =
		useState<ApprovalSubmitterEmailTemplate>("submission_create_approved");
	const [rejectionEmailTemplate, setRejectionEmailTemplate] =
		useState<RejectionSubmitterEmailTemplate>("submission_rejected");
	const [
		availableDecisionEmailTemplatePaths,
		setAvailableDecisionEmailTemplatePaths,
	] = useState<string[] | null>(null);

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
	const linkedCategorySubmissions = useMemo(
		() =>
			allSubmissions.filter((linkedSubmission) => {
				if (linkedSubmission.entity_type !== "category") return false;
				const meta =
					linkedSubmission.meta &&
					typeof linkedSubmission.meta === "object" &&
					!Array.isArray(linkedSubmission.meta)
						? (linkedSubmission.meta as Record<string, unknown>)
						: {};
				return meta.institutionSubmissionId === submissionId;
			}),
		[allSubmissions, submissionId],
	);

	const {
		hasSubmissionId,
		resolvedSubmissionWithFallback,
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
		didFetchInstitution,
		shouldShowGrantSubmitterAccessToggle,
		canReviewCurrentSubmission,
	} = useInstitutionSubmissionReview({
		submissionId,
		submission,
		submissions,
		institutionPermissions,
		removeSubmission,
		upsertSubmission,
	});
	useEffect(() => {
		let isMounted = true;
		void getSubmissionDecisionEmailTemplateOptions()
			.then((templates) => {
				if (!isMounted) return;
				setAvailableDecisionEmailTemplatePaths(
					templates.map((template) => template.path),
				);
			})
			.catch(() => {
				if (!isMounted) return;
				setAvailableDecisionEmailTemplatePaths([]);
			});

		return () => {
			isMounted = false;
		};
	}, []);
	useEffect(() => {
		if (resolvedSubmissionWithFallback?.type === "claim") {
			setApprovalEmailTemplate(
				pickAvailableTemplate(
					["claim_approved", ...APPROVAL_EMAIL_TEMPLATES],
					availableDecisionEmailTemplatePaths,
					"claim_approved",
				),
			);
			setRejectionEmailTemplate(
				pickAvailableTemplate(
					["claim_rejected", ...REJECTION_EMAIL_TEMPLATES],
					availableDecisionEmailTemplatePaths,
					"claim_rejected",
				),
			);
			return;
		}
		if (shouldShowGrantSubmitterAccessToggle && grantSubmitterAccess) {
			setApprovalEmailTemplate(
				pickAvailableTemplate(
					["claim_approved", ...APPROVAL_EMAIL_TEMPLATES],
					availableDecisionEmailTemplatePaths,
					"claim_approved",
				),
			);
			setRejectionEmailTemplate(
				pickAvailableTemplate(
					REJECTION_EMAIL_TEMPLATES,
					availableDecisionEmailTemplatePaths,
					"submission_rejected",
				),
			);
			return;
		}
		const defaultApprovalTemplate =
			resolvedSubmissionWithFallback?.type === "update"
				? "submission_update_approved"
				: "submission_create_approved";
		setApprovalEmailTemplate(
			pickAvailableTemplate(
				[defaultApprovalTemplate, ...APPROVAL_EMAIL_TEMPLATES],
				availableDecisionEmailTemplatePaths,
				defaultApprovalTemplate,
			),
		);
		setRejectionEmailTemplate(
			pickAvailableTemplate(
				REJECTION_EMAIL_TEMPLATES,
				availableDecisionEmailTemplatePaths,
				"submission_rejected",
			),
		);
	}, [
		availableDecisionEmailTemplatePaths,
		grantSubmitterAccess,
		resolvedSubmissionWithFallback?.type,
		shouldShowGrantSubmitterAccessToggle,
	]);
	useEffect(() => {
		if (!resolvedSubmissionWithFallback) return;
		setNotifySubmitter(resolvedSubmissionWithFallback.type === "claim");
	}, [
		resolvedSubmissionWithFallback?.id,
		resolvedSubmissionWithFallback?.type,
	]);
	const shouldAutoCloseMissingSubmission =
		!hasSubmissionId ||
		(didResolveSubmission && !resolvedSubmissionWithFallback);
	useEffect(() => {
		if (!shouldAutoCloseMissingSubmission) return;
		closeModal();
	}, [shouldAutoCloseMissingSubmission, closeModal]);
	const handleReviewAction = useCallback(
		async (status: "approved" | "rejected") => {
			if (!resolvedSubmissionWithFallback) return;
			const selectedEmailTemplate =
				status === "approved" ? approvalEmailTemplate : rejectionEmailTemplate;
			const canUseSelectedEmailTemplate =
				availableDecisionEmailTemplatePaths?.includes(
					getDecisionEmailTemplatePath(selectedEmailTemplate),
				) ?? false;
			const success = await handleReview(status, {
				notifySubmitter: notifySubmitter && canUseSelectedEmailTemplate,
				submitterEmailTemplate: canUseSelectedEmailTemplate
					? selectedEmailTemplate
					: undefined,
			});
			if (!success) {
				setReviewError(
					error ?? t("content.institutionFormModal.review.errorDescription"),
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
					? t("content.institutionFormModal.review.success.approve.title")
					: t("content.institutionFormModal.review.success.reject.title"),
				status === "approved"
					? t("content.institutionFormModal.review.success.approve.description")
					: t("content.institutionFormModal.review.success.reject.description"),
			);
			if (shouldRefresh) {
				queueMicrotask(() => router.refresh());
			}
		},
		[
			closeModal,
			error,
			handleReview,
			notifySubmitter,
			approvalEmailTemplate,
			availableDecisionEmailTemplatePaths,
			rejectionEmailTemplate,
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
				error ?? t("content.institutionFormModal.review.errorDescription"),
			);
			return;
		}
		triggerAccountRefresh(["submissions", "entityAudits"]);
		showSuccessToast(
			t("content.institutionFormModal.review.success.saveNotes.title"),
			t("content.institutionFormModal.review.success.saveNotes.description"),
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
	const isClaimSubmission = resolvedSubmissionWithFallback.type === "claim";
	const shouldWaitForClaimInstitution =
		isClaimSubmission &&
		typeof resolvedSubmissionWithFallback.entity_id === "number" &&
		!didFetchInstitution &&
		!originalInstitution;
	if (shouldWaitForClaimInstitution) {
		return (
			<Modal
				title={t("content.institutionFormModal.review.loadingTitle", {
					defaultValue: "Einreichung wird geladen",
				})}
				variant="fullscreen"
				returnTo={returnTo}
				routePath={routePath}
				loadingState={{
					active: true,
					label: t("content.institutionFormModal.review.loadingLabel", {
						defaultValue: "Einreichung wird geladen...",
					}),
				}}
			/>
		);
	}
	const submissionStatus = resolvedSubmissionWithFallback.status;
	const submissionStatusLabel = (() => {
		if (!submissionStatus) return "";
		const key = `submission_status.${submissionStatus}`;
		const translated = tEnum("enumMap." + key);
		return translated === key ? submissionStatus : translated;
	})();
	const submissionTypeLabel = t(
		`content.institutionsTable.type.submissionBase.${resolvedSubmissionWithFallback.type}`,
		{
			defaultValue: resolvedSubmissionWithFallback.type,
		},
	);
	const requesterLabel =
		formatUserDisplayName(resolvedSubmissionWithFallback.creator) ??
		resolvedSubmissionWithFallback.creator?.email ??
		resolvedSubmissionWithFallback.created_by ??
		"—";
	const isTemplateAvailable = (template: VisibleSubmitterEmailTemplate) =>
		availableDecisionEmailTemplatePaths?.includes(
			getDecisionEmailTemplatePath(template),
		) ?? false;
	const approvalEmailTemplateOptions: Array<{
		value: ApprovalSubmitterEmailTemplate;
		label: string;
	}> = APPROVAL_EMAIL_TEMPLATES.filter(isTemplateAvailable).map((template) => ({
		value: template,
		label: t(`content.institutionFormModal.review.emailTemplates.${template}`, {
			defaultValue: template,
		}),
	}));
	const rejectionEmailTemplateOptions: Array<{
		value: RejectionSubmitterEmailTemplate;
		label: string;
	}> = REJECTION_EMAIL_TEMPLATES.filter(isTemplateAvailable).map(
		(template) => ({
			value: template,
			label: t(
				`content.institutionFormModal.review.emailTemplates.${template}`,
				{
					defaultValue: template,
				},
			),
		}),
	);
	const isLoadingDecisionEmailTemplates =
		availableDecisionEmailTemplatePaths === null;
	const hasApprovalEmailTemplate = approvalEmailTemplateOptions.length > 0;
	const hasRejectionEmailTemplate = rejectionEmailTemplateOptions.length > 0;
	const submissionTitle =
		submissionStatus === "approved" ||
		submissionStatus === "rejected" ||
		submissionStatus === "needs_changes"
			? t(
					`content.institutionsTable.type.submissionStatus.${submissionStatus}`,
					{
						type: submissionTypeLabel,
						defaultValue: submissionTypeLabel,
					},
				)
			: t(
					`content.institutionsTable.type.submission.${resolvedSubmissionWithFallback.type}`,
					{
						defaultValue: resolvedSubmissionWithFallback.type,
					},
				);
	const reviewData =
		isClaimSubmission && originalInstitution
			? originalInstitution
			: (originalInstitution ?? draft);
	const reviewNewData =
		isClaimSubmission || !originalInstitution ? undefined : draft;

	return (
		<Modal
			title={submissionTitle}
			variant="fullscreen"
			returnTo={returnTo}
			routePath={routePath}
			closeConfirmation={{
				title: t("content.institutionModalCloseConfirmation.title"),
				description: t("content.institutionModalCloseConfirmation.description"),
				confirmLabel: t("content.institutionModalCloseConfirmation.confirm"),
				cancelLabel: t("content.institutionModalCloseConfirmation.cancel"),
			}}
			errorDialog={
				reviewError
					? {
							open: true,
							title: t("content.institutionFormModal.review.errorTitle"),
							description: reviewError,
							confirmLabel: t("common.close"),
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
					data={reviewData}
					newData={reviewNewData}
					showPreviewHint={!isClaimSubmission}
					onEditSection={
						isClaimSubmission
							? undefined
							: (sectionId) => {
									router.push(
										toLocalePath(
											`${editBasePath}/${submissionId}/edit#${sectionId}`,
										),
									);
								}
					}
				/>

				{canReviewCurrentSubmission && (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<h2>
								{t("content.institutionFormModal.review.reviewPanelTitle", {
									defaultValue: "Einreichung prüfen",
								})}
							</h2>
							{submissionStatus && (
								<span className="body2">
									{t("content.institutionFormModal.review.statusLabel", {
										status: submissionStatusLabel,
									})}
								</span>
							)}
						</div>
						{linkedCategorySubmissions.length > 0 ? (
							<Card variant="tertiary">
								<CardContent variant="tertiary" className="space-y-3 p-3">
									<div className="body2 font-bold">
										{t(
											"content.institutionFormModal.review.linkedCategorySubmissions",
											{
												defaultValue: "Verknüpfte Kategorie-Vorschläge",
											},
										)}
									</div>
									<div className="flex flex-wrap gap-2">
										{linkedCategorySubmissions.map((categorySubmission) => {
											const data =
												categorySubmission.data &&
												typeof categorySubmission.data === "object" &&
												!Array.isArray(categorySubmission.data)
													? (categorySubmission.data as Record<string, unknown>)
													: {};
											const label =
												typeof data.key === "string" &&
												data.key.trim().length > 0
													? data.key
													: `#${categorySubmission.id}`;
											return (
												<Button
													key={categorySubmission.id}
													type="button"
													variant="tertiary"
													size="inline"
													fullWidth={false}
													className="underline"
													onClick={() =>
														router.push(
															toLocalePath(
																`/account/submissions/${categorySubmission.id}`,
															),
														)
													}
												>
													{label}
												</Button>
											);
										})}
									</div>
								</CardContent>
							</Card>
						) : null}
						{resolvedSubmissionWithFallback.type === "create" &&
							typeof submissionId === "number" && (
								<QuestionnaireAnswerRelinkPanel submissionId={submissionId} />
							)}
						<Card variant="tertiary">
							<CardContent variant="tertiary" className="space-y-3 p-3">
								<div className="body2">
									{t("content.institutionFormModal.review.notesLabel")}
								</div>
								{resolvedSubmissionWithFallback.notes?.length ? (
									<div className="space-y-2">
										<div className="body2">
											{t(
												"content.institutionFormModal.review.previousNotesLabel",
											)}
										</div>
										<div className="space-y-2">
											{resolvedSubmissionWithFallback.notes.map((note) => (
												<Card key={note.id} variant="tertiary">
													<CardContent variant="tertiary" className="p-3">
														<div className="body3 whitespace-pre-wrap font-bold">
															{note.note}
														</div>
														<div className="mt-2 body3 text-muted-foreground">
															{t(
																"content.institutionFormModal.review.noteMeta",
																{
																	defaultValue: "{{author}} am {{date}}",
																	author:
																		formatUserDisplayName(note.creator) ??
																		note.creator?.email ??
																		t("common.auth.account.activity.system", {
																			defaultValue: "System",
																		}),
																	date: formatDateWithLocale(note.created_at, {
																		locale: i18n.language,
																		format: {
																			dateStyle: "medium",
																			timeStyle: "short",
																		},
																	}),
																},
															)}
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
									placeholder={t(
										"content.institutionFormModal.review.notesPlaceholder",
									)}
									rows={4}
									disabled={submitting}
								/>
							</CardContent>
						</Card>
						<Card variant="tertiary">
							<CardContent variant="tertiary" className="space-y-3 p-3">
								<InfoItem
									label={t("content.institutionFormModal.review.requestedBy", {
										defaultValue: "Requested by",
									})}
									alwaysShow
								>
									{requesterLabel}
								</InfoItem>

								{!isClaimSubmission &&
								(userOptions.length > 0 ||
									groupOptions.length > 0 ||
									shouldShowGrantSubmitterAccessToggle) ? (
									<div className="space-y-3">
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
													{t(
														"content.institutionFormModal.review.grantSubmitterAccess",
													)}
												</span>
											</label>
										) : null}
										{userOptions.length > 0 || groupOptions.length > 0 ? (
											<div className="space-y-3">
												<span className="body2">
													{t(
														"content.institutionFormModal.review.attachOnApproval",
													)}
												</span>
												<div className="flex flex-col gap-3">
													{userOptions.length > 0 && (
														<div className="flex-1">
															<MultiSelectModal
																title={t(
																	"content.institutionFormModal.review.attachUsers.title",
																)}
																placeholder={t(
																	"content.institutionFormModal.review.attachUsers.placeholder",
																)}
																searchPlaceholder={t(
																	"content.institutionFormModal.review.attachUsers.searchPlaceholder",
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
																	"content.institutionFormModal.review.attachGroups.title",
																)}
																placeholder={t(
																	"content.institutionFormModal.review.attachGroups.placeholder",
																)}
																searchPlaceholder={t(
																	"content.institutionFormModal.review.attachGroups.searchPlaceholder",
																)}
																options={groupOptions}
																selected={attachGroupIds.map(String)}
																onChange={(ids) =>
																	setAttachGroupIds(ids.map(Number))
																}
																disabled={submitting}
															/>
														</div>
													)}
												</div>
											</div>
										) : null}
									</div>
								) : null}
							</CardContent>
						</Card>
						<SubmissionDecisionEmailPanel
							t={t}
							notifySubmitter={notifySubmitter}
							onNotifySubmitterChange={setNotifySubmitter}
							approvalEmailTemplate={approvalEmailTemplate}
							onApprovalEmailTemplateChange={setApprovalEmailTemplate}
							approvalEmailTemplateOptions={approvalEmailTemplateOptions}
							rejectionEmailTemplate={rejectionEmailTemplate}
							onRejectionEmailTemplateChange={setRejectionEmailTemplate}
							rejectionEmailTemplateOptions={rejectionEmailTemplateOptions}
							isLoadingDecisionEmailTemplates={isLoadingDecisionEmailTemplates}
							submitting={submitting}
							isTemplateAvailable={isTemplateAvailable}
						/>
						<div className="flex flex-wrap items-center justify-end gap-3">
							<Button
								type="button"
								variant="destructive"
								onClick={() => void handleReviewAction("rejected")}
								disabled={
									submitting ||
									(notifySubmitter &&
										(isLoadingDecisionEmailTemplates ||
											!hasRejectionEmailTemplate))
								}
							>
								{t("content.institutionFormModal.review.actions.reject")}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => void handleSaveNoteAction()}
								disabled={submitting || internalNotes.trim().length === 0}
							>
								{t("content.institutionFormModal.review.actions.saveNotes", {
									defaultValue: "Save notes",
								})}
							</Button>
							<Button
								type="button"
								onClick={() => void handleReviewAction("approved")}
								disabled={
									submitting ||
									(notifySubmitter &&
										(isLoadingDecisionEmailTemplates ||
											!hasApprovalEmailTemplate))
								}
							>
								{t("content.institutionFormModal.review.actions.approve")}
							</Button>
						</div>
					</div>
				)}
			</div>
		</Modal>
	);
}
