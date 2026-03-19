"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";
import { buildAddressFromFormData } from "@/lib/utils/formUtils";
import { institutionSubmissionToDraft } from "@/lib/utils/institutionSubmissionUtils";
import { buildSubmissionDiff } from "@/lib/utils/submissionDiff";
import type { Prisma } from "@/generated/prisma";
import {
	deleteSubmission,
	getSubmissionById,
	updateSubmission,
} from "@/server/actions/submissions";
import { useAccountStore } from "@/lib/store/accountStore";
import type { Institution } from "@/types/institution";
import type { Submission } from "@/types/submission";
import { useRouter } from "next/navigation";
import { AlertDialog } from "../ui/alert-dialog";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { buildInstitutionForFormFromDraft } from "@/lib/utils/institutionFormAdapter";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";

type InstitutionDraftEditModalProps = {
	returnTo?: string;
	submissionId?: number;
	shouldRefresh?: boolean;
	routePath?: string;
};

export function InstitutionDraftEditModal({
	returnTo,
	submissionId,
	shouldRefresh = false,
	routePath,
}: InstitutionDraftEditModalProps) {
	const { t } = useTranslation("content");
	const hasSubmissionId = typeof submissionId === "number";
	const resolvedSubmission = useAccountStore((state) => {
		if (!hasSubmissionId) return undefined;
		return state.submissions.find(
			(item) =>
				item.id === submissionId &&
				item.entity_type === "institution" &&
				(item.type === "create" || item.type === "update"),
		);
	});
	const upsertSubmission = useAccountStore((state) => state.upsertSubmission);
	const removeSubmission = useAccountStore((state) => state.removeSubmission);
	const categories = useAccountStore((state) => state.categories);
	const router = useRouter();

	const [fetchedSubmission, setFetchedSubmission] = useState<Submission | null>(
		null,
	);
	const [didFetchSubmission, setDidFetchSubmission] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const resolvedSubmissionWithFallback =
		resolvedSubmission ?? fetchedSubmission ?? undefined;

	useEffect(() => {
		if (!hasSubmissionId || resolvedSubmission || didFetchSubmission) return;
		let active = true;
		const fetchSubmission = async () => {
			try {
				const result = await getSubmissionById(submissionId);
				if (!active) return;
				setFetchedSubmission(result ?? null);
			} catch (error) {
				reportClientTelemetry({
					level: "warn",
					event: "institution_draft.edit.fetch_failed",
					error,
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
		fetchSubmission();
		return () => {
			active = false;
		};
	}, [didFetchSubmission, hasSubmissionId, resolvedSubmission, submissionId]);

	const handleSubmit = useCallback(
		async (data: Record<string, unknown>) => {
			try {
				const payload: Record<string, unknown> = {
					...data,
					address: buildAddressFromFormData(data),
				};
				if (!resolvedSubmissionWithFallback || !hasSubmissionId) return;
				const sourceInstitution =
					resolvedSubmissionWithFallback.type === "update" &&
					typeof payload.originalInstitution === "object" &&
					payload.originalInstitution !== null
						? (payload.originalInstitution as Record<string, unknown>)
						: undefined;
				const submissionDiff =
					resolvedSubmissionWithFallback.type === "update"
						? buildSubmissionDiff(payload, sourceInstitution)
						: undefined;
				const updated = await updateSubmission({
					id: submissionId,
					data: payload as Prisma.InputJsonValue,
					diff: submissionDiff as Prisma.InputJsonValue | undefined,
				});
				if (updated) {
					upsertSubmission(updated);
				}
				if (shouldRefresh) {
					router.refresh();
				}
			} catch (error) {
				reportClientTelemetry({
					level: "error",
					event: "institution_draft.edit.submit_failed",
					error,
					metadata: {
						submission_id: submissionId,
						submission_type: resolvedSubmissionWithFallback?.type,
						entity_id: resolvedSubmissionWithFallback?.entity_id,
					},
				});
				throw error;
			}
		},
		[
			router,
			upsertSubmission,
			submissionId,
			shouldRefresh,
			hasSubmissionId,
			resolvedSubmissionWithFallback,
		],
	);

	const handleDeleteDraft = useCallback(async () => {
		if (!hasSubmissionId || typeof submissionId !== "number") return;
		if (isDeleting) return;
		setIsDeleting(true);
		try {
			await deleteSubmission(submissionId);
			removeSubmission(submissionId);
			showSuccessToast(
				t("institutionDraftEditModal.delete.successTitle", {
					defaultValue: "Entwurf gelöscht",
				}),
				t("institutionDraftEditModal.delete.successDescription", {
					defaultValue: "Die Einreichung wurde gelöscht.",
				}),
			);
			if (shouldRefresh) {
				router.refresh();
			}
		} catch (error) {
			reportClientTelemetry({
				level: "error",
				event: "institution_draft.edit.delete_failed",
				error,
				metadata: {
					submission_id: submissionId,
				},
			});
			setIsDeleting(false);
			throw error;
		}
	}, [
		hasSubmissionId,
		isDeleting,
		removeSubmission,
		router,
		shouldRefresh,
		submissionId,
		t,
	]);

	const institutionForForm = useMemo(() => {
		const draft = institutionSubmissionToDraft({
			data: (resolvedSubmissionWithFallback?.data ?? {}) as Record<
				string,
				unknown
			>,
		});
		return buildInstitutionForFormFromDraft(
			{
				...draft,
				entityId: resolvedSubmissionWithFallback?.entity_id ?? undefined,
			},
			categories,
		) as Institution;
	}, [resolvedSubmissionWithFallback, categories]);

	const isLoading =
		hasSubmissionId && !resolvedSubmissionWithFallback && !didFetchSubmission;
	const isNotFound =
		!hasSubmissionId ||
		(!isLoading && !resolvedSubmissionWithFallback && !isDeleting);

	if (isLoading) {
		return null;
	}

	if (isNotFound) {
		return (
			<AlertDialog
				status="error"
				title={t("institutionFormModal.dialog.notFound.title")}
				description={t("institutionFormModal.dialog.notFound.description")}
			/>
		);
	}

	return (
		<InstitutionFormModal
			mode="create"
			permissionContext="submission"
			returnTo={returnTo}
			routePath={routePath}
			closeConfirmation={{
				title: t("institutionModalCloseConfirmation.title"),
				description: t("institutionModalCloseConfirmation.description"),
				confirmLabel: t("institutionModalCloseConfirmation.confirm"),
				cancelLabel: t("institutionModalCloseConfirmation.cancel"),
			}}
			formKey={`draft-${submissionId ?? "new"}-${
				resolvedSubmissionWithFallback ? "loaded" : "loading"
			}`}
			institution={institutionForForm}
			onSubmit={({ data }) => handleSubmit(data)}
			onDelete={handleDeleteDraft}
			deleteConfig={{
				buttonLabel: t("institutionDraftEditModal.delete.button", {
					defaultValue: "Entwurf löschen",
				}),
				confirmTitle: t("institutionDraftEditModal.delete.confirmTitle", {
					defaultValue: "Entwurf löschen?",
				}),
				confirmDescription: t(
					"institutionDraftEditModal.delete.confirmDescription",
					{
						defaultValue:
							"Die Einreichung wird dauerhaft entfernt. Diese Aktion kann nicht rückgängig gemacht werden.",
					},
				),
				confirmLabel: t("institutionDraftEditModal.delete.confirm", {
					defaultValue: "Löschen",
				}),
				cancelLabel: t("institutionDraftEditModal.delete.cancel", {
					defaultValue: "Abbrechen",
				}),
			}}
			closeOnSubmit
			submitLabel={t("institutionFormModal.actions.save")}
			shouldRefresh={shouldRefresh}
		/>
	);
}
