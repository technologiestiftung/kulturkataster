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
import { useRouter } from "next/navigation";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

type InstitutionEditModalProps = {
	institutionId: string;
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
	const { t } = useTranslation("content");
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
	const router = useRouter();

	const numericInstitutionId = useMemo(() => {
		const parsed = Number(institutionId);
		return Number.isFinite(parsed) ? parsed : undefined;
	}, [institutionId]);

	const resolvedInstitution = useMemo(() => {
		if (!numericInstitutionId) return undefined;
		if (activeInstitutionEdit?.id === numericInstitutionId) {
			return activeInstitutionEdit;
		}
		return institutions.find((item) => item.id === numericInstitutionId);
	}, [activeInstitutionEdit, institutions, numericInstitutionId]);

	if (!numericInstitutionId) {
		return (
			<AlertDialog
				status="error"
				confirmLabel={t("close")}
				onConfirm={() => router.back()}
				title={t("institutionFormModal.dialog.notFound.title")}
				description={t("institutionFormModal.dialog.notFound.description")}
			/>
		);
	}

	useEffect(() => {
		if (!numericInstitutionId || resolvedInstitution || didFetchInstitution) {
			return;
		}
		let active = true;
		const fetchInstitution = async () => {
			try {
				const result = await getInstitutionById(numericInstitutionId);
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
	}, [didFetchInstitution, numericInstitutionId, resolvedInstitution]);

	useEffect(() => {
		if (
			activeInstitutionEdit &&
			activeInstitutionEdit.id !== numericInstitutionId
		) {
			setActiveInstitutionEdit(null);
		}
	}, [activeInstitutionEdit, numericInstitutionId, setActiveInstitutionEdit]);

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
			showSuccessToast(
				t("institutionFormModal.feedback.delete.title"),
				t("institutionFormModal.feedback.delete.description"),
			);
			return;
		}

		if (deleteResult.error !== "forbidden") {
			setIsDeleting(false);
			setDeleteError({
				title: t("institutionFormModal.delete.errorTitle", {
					defaultValue: "Delete failed",
				}),
				description: t("institutionFormModal.delete.errorDescription", {
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
			showSuccessToast(
				t("institutionFormModal.feedback.deleteRequest.title"),
				t("institutionFormModal.feedback.deleteRequest.description"),
			);
		} catch {
			setIsDeleting(false);
			setDeleteError({
				title: t("institutionFormModal.delete.errorTitle", {
					defaultValue: "Delete failed",
				}),
				description: t("institutionFormModal.delete.errorDescription", {
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
				title={t("institutionFormModal.dialog.notFound.title")}
				variant="editor"
				hasFooter={false}
				routePath={routePath}
				returnTo={returnTo}
				autoCloseError={{
					active: true,
					title: t("institutionFormModal.dialog.notFound.title"),
					description: t("institutionFormModal.dialog.notFound.description"),
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
					title: t("institutionModalCloseConfirmation.title"),
					description: t("institutionModalCloseConfirmation.description"),
					confirmLabel: t("institutionModalCloseConfirmation.confirm"),
					cancelLabel: t("institutionModalCloseConfirmation.cancel"),
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
						"institutionFormModal.delete.confirmDescription",
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
					confirmLabel={t("close")}
					onConfirm={() => setDeleteError(null)}
					onOpenChange={(open) => {
						if (!open) setDeleteError(null);
					}}
				/>
			) : null}
		</>
	);
}
