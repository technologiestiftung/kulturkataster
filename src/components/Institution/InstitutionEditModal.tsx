"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Modal } from "@/components/Modals/Modal";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";
import { useAccountStore } from "@/lib/store/accountStore";
import {
	deleteInstitution,
	getInstitutionById,
} from "@/server/actions/institutions";
import { createSubmission } from "@/server/actions/submissions";
import { SubmissionEntityType, SubmissionType } from "@/generated/prisma";
import type { Institution } from "@/types/institution";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";

type InstitutionEditModalProps = {
	institutionId: number;
	routePath?: string;
	returnTo?: string;
	onSubmit?: Parameters<typeof InstitutionFormModal>[0]["onSubmit"];
	formKey?: string;
	submitLabel?: string;
	submitting?: boolean;
	closeOnSubmit?: boolean;
	shouldRefresh?: boolean;
};

export function InstitutionEditModal({
	institutionId,
	routePath,
	returnTo,
	onSubmit,
	formKey,
	submitLabel,
	submitting,
	closeOnSubmit,
	shouldRefresh = false,
}: InstitutionEditModalProps) {
	const { t } = useTranslation();
	const institutions = useAccountStore((state) => state.institutions);
	const activeInstitutionEdit = useAccountStore(
		(state) => state.activeInstitutionEdit,
	);
	const setActiveInstitutionEdit = useAccountStore(
		(state) => state.setActiveInstitutionEdit,
	);
	const removeInstitution = useAccountStore((state) => state.removeInstitution);
	const upsertSubmission = useAccountStore((state) => state.upsertSubmission);
	const [isDeleting, setIsDeleting] = useState(false);
	const [deleteError, setDeleteError] = useState<{
		title: string;
		description: string;
	} | null>(null);
	const [fetchedInstitution, setFetchedInstitution] =
		useState<Institution | null>(null);
	const [didFetchInstitution, setDidFetchInstitution] = useState(false);

	const resolvedInstitution = useMemo(() => {
		if (activeInstitutionEdit?.id === institutionId) {
			return activeInstitutionEdit;
		}
		return institutions.find((item) => item.id === institutionId);
	}, [activeInstitutionEdit, institutionId, institutions]);

	useEffect(() => {
		if (resolvedInstitution || didFetchInstitution) {
			return;
		}
		let active = true;
		const fetchInstitution = async () => {
			try {
				const result = await getInstitutionById(institutionId);
				if (!active) return;
				setFetchedInstitution(result ?? null);
			} catch {
				if (active) {
					setFetchedInstitution(null);
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
	}, [didFetchInstitution, institutionId, resolvedInstitution]);

	useEffect(() => {
		if (activeInstitutionEdit && activeInstitutionEdit.id !== institutionId) {
			setActiveInstitutionEdit(null);
		}
	}, [activeInstitutionEdit, institutionId, setActiveInstitutionEdit]);

	const resolvedInstitutionWithFallback =
		resolvedInstitution ?? fetchedInstitution ?? undefined;
	const isLoadingInstitution =
		!resolvedInstitutionWithFallback && !didFetchInstitution && !isDeleting;
	const showNotFound =
		didFetchInstitution && !resolvedInstitutionWithFallback && !isDeleting;

	const handleDelete = useCallback(async () => {
		if (!resolvedInstitutionWithFallback || isDeleting) return;
		setIsDeleting(true);

		const deleteResult = await deleteInstitution(
			resolvedInstitutionWithFallback.id,
		);
		if (deleteResult.ok) {
			removeInstitution(resolvedInstitutionWithFallback.id);
			triggerAccountRefresh(["institutions", "entityAudits"]);
			showSuccessToast(
				t("content.institutionFormModal.feedback.delete.title"),
				t("content.institutionFormModal.feedback.delete.description"),
			);
			return;
		}

		if (deleteResult.error !== "forbidden") {
			setIsDeleting(false);
			setDeleteError({
				title: t("content.institutionFormModal.delete.errorTitle", {
					defaultValue: "Delete failed",
				}),
				description: t("content.institutionFormModal.delete.errorDescription", {
					defaultValue:
						"Please try again or contact support if the issue persists.",
				}),
			});
			throw new Error("delete-failed");
		}

		try {
			const deleteSubmission = await createSubmission({
				entityType: SubmissionEntityType.institution,
				entityId: resolvedInstitutionWithFallback.id,
				type: SubmissionType.delete,
				data: {
					...resolvedInstitutionWithFallback,
				},
				meta: {
					institution_id: resolvedInstitutionWithFallback.id,
					institution_name: resolvedInstitutionWithFallback.name,
				},
			});
			upsertSubmission(deleteSubmission);
			triggerAccountRefresh(["submissions", "entityAudits"]);
			showSuccessToast(
				t("content.institutionFormModal.feedback.deleteRequest.title"),
				t("content.institutionFormModal.feedback.deleteRequest.description"),
			);
		} catch {
			setIsDeleting(false);
			setDeleteError({
				title: t("content.institutionFormModal.delete.errorTitle", {
					defaultValue: "Delete failed",
				}),
				description: t("content.institutionFormModal.delete.errorDescription", {
					defaultValue:
						"Please try again or contact support if the issue persists.",
				}),
			});
			throw new Error("delete-failed");
		}
	}, [
		isDeleting,
		removeInstitution,
		resolvedInstitutionWithFallback,
		t,
		upsertSubmission,
	]);

	if (showNotFound) {
		return (
			<Modal
				title={t("content.institutionFormModal.dialog.notFound.title")}
				variant="editor"
				hasFooter={false}
				routePath={routePath}
				returnTo={returnTo}
				autoCloseError={{
					active: true,
					title: t("content.institutionFormModal.dialog.notFound.title"),
					description: t(
						"content.institutionFormModal.dialog.notFound.description",
					),
				}}
			/>
		);
	}

	return (
		<>
			<InstitutionFormModal
				mode="edit"
				institution={resolvedInstitutionWithFallback}
				isLoadingInstitution={isLoadingInstitution}
				returnTo={returnTo}
				routePath={routePath}
				closeConfirmation={{
					title: t("content.institutionModalCloseConfirmation.title"),
					description: t(
						"content.institutionModalCloseConfirmation.description",
					),
					confirmLabel: t("content.institutionModalCloseConfirmation.confirm"),
					cancelLabel: t("content.institutionModalCloseConfirmation.cancel"),
				}}
				onSubmit={onSubmit}
				formKey={formKey}
				submitLabel={submitLabel}
				submitting={submitting}
				closeOnSubmit={closeOnSubmit}
				shouldRefresh={shouldRefresh}
				onDelete={handleDelete}
				deleteConfig={{
					confirmDescription: t(
						"content.institutionFormModal.delete.confirmDescription",
						{
							defaultValue:
								"If you can delete this institution directly, it will be removed immediately. Otherwise, a delete request will be submitted for review.",
						},
					),
				}}
			/>

			{deleteError ? (
				<AlertDialog
					open
					status="error"
					title={deleteError.title}
					description={deleteError.description}
					confirmLabel={t("common.close")}
					onConfirm={() => setDeleteError(null)}
					onOpenChange={(open) => {
						if (!open) setDeleteError(null);
					}}
				/>
			) : null}
		</>
	);
}
