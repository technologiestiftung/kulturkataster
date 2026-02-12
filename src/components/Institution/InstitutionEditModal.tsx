"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";
import { useAccountStore } from "@/lib/store/accountStore";
import {
	deleteInstitution,
	getInstitutionById,
} from "@/server/actions/institutions";
import { createSubmission } from "@/server/actions/submissions";
import { SubmissionEntityType, SubmissionType } from "@/generated/prisma";
import type { Institution } from "@/types/institution";

type InstitutionEditModalProps = {
	institutionId: string;
	routePath?: string;
	returnTo?: string;
	onSubmit?: Parameters<typeof InstitutionFormModal>[0]["onSubmit"];
	initialValues?: Record<string, unknown>;
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
	initialValues,
	formKey,
	submitLabel,
	submitting,
	closeOnSubmit,
	shouldRefresh = false,
}: InstitutionEditModalProps) {
	const { t } = useTranslation("content");
	const institutions = useAccountStore((state) => state.institutions);
	const setAlertDialog = useAccountStore((state) => state.setAlertDialog);
	const removeInstitution = useAccountStore((state) => state.removeInstitution);
	const upsertSubmission = useAccountStore((state) => state.upsertSubmission);
	const [fetchedInstitution, setFetchedInstitution] =
		useState<Institution | null>(null);
	const [didFetchInstitution, setDidFetchInstitution] = useState(false);

	const numericInstitutionId = useMemo(() => {
		const parsed = Number(institutionId);
		return Number.isFinite(parsed) ? parsed : undefined;
	}, [institutionId]);

	const resolvedInstitution = useMemo(() => {
		if (!numericInstitutionId) return undefined;
		return institutions.find((item) => item.id === numericInstitutionId);
	}, [institutions, numericInstitutionId]);

	if (!numericInstitutionId) {
		return (
			<AlertDialog
				status="error"
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

	const resolvedInstitutionWithFallback =
		resolvedInstitution ?? fetchedInstitution ?? undefined;
	const showNotFound = didFetchInstitution && !resolvedInstitutionWithFallback;

	const isDeleteDeniedError = useCallback((error: unknown) => {
		if (!(error instanceof Error)) return false;
		if (error.name === "RBACError") return true;
		const message = error.message.toLowerCase();
		return (
			message.includes("not authorized") ||
			message.includes("lacks delete") ||
			message.includes("global delete access required")
		);
	}, []);

	const handleDelete = useCallback(async () => {
		if (!resolvedInstitutionWithFallback) return;

		try {
			await deleteInstitution(resolvedInstitutionWithFallback.id);
			removeInstitution(resolvedInstitutionWithFallback.id);
			setAlertDialog({
				title: t("institutionFormModal.feedback.delete.title"),
				description: t("institutionFormModal.feedback.delete.description"),
			});
			return;
		} catch (error) {
			if (!isDeleteDeniedError(error)) {
				setAlertDialog({
					title: t("institutionFormModal.delete.errorTitle", {
						defaultValue: "Delete failed",
					}),
					description: t("institutionFormModal.delete.errorDescription", {
						defaultValue:
							"Please try again or contact support if the issue persists.",
					}),
				});
				throw error;
			}
		}

		try {
			const deleteSubmission = await createSubmission({
				entityType: SubmissionEntityType.institution,
				entityId: resolvedInstitutionWithFallback.id,
				type: SubmissionType.delete,
				status: "approval_pending",
				data: {
					...resolvedInstitutionWithFallback,
				},
				meta: {
					institution_id: resolvedInstitutionWithFallback.id,
					institution_name: resolvedInstitutionWithFallback.name,
				},
			});
			upsertSubmission(deleteSubmission);
			setAlertDialog({
				title: t("institutionFormModal.feedback.deleteRequest.title"),
				description: t(
					"institutionFormModal.feedback.deleteRequest.description",
				),
			});
		} catch {
			setAlertDialog({
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
		isDeleteDeniedError,
		removeInstitution,
		resolvedInstitutionWithFallback,
		setAlertDialog,
		t,
		upsertSubmission,
	]);

	if (!resolvedInstitutionWithFallback && !didFetchInstitution) {
		return null;
	}

	if (showNotFound) {
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
			mode="edit"
			institution={resolvedInstitutionWithFallback}
			returnTo={returnTo}
			routePath={routePath}
			closeConfirmation={{
				title: t("institutionModalCloseConfirmation.title"),
				description: t("institutionModalCloseConfirmation.description"),
				confirmLabel: t("institutionModalCloseConfirmation.confirm"),
				cancelLabel: t("institutionModalCloseConfirmation.cancel"),
			}}
			onSubmit={onSubmit}
			initialValues={initialValues}
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
	);
}
