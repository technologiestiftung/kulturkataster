"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { InstitutionFormModal } from "@/components/Institution/InstitutionFormModal";
import { useAccountStore } from "@/lib/store/accountStore";
import { getInstitutionById } from "@/server/actions/institutions";
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
			onSubmit={onSubmit}
			initialValues={initialValues}
			formKey={formKey}
			submitLabel={submitLabel}
			submitting={submitting}
			closeOnSubmit={closeOnSubmit}
			shouldRefresh={shouldRefresh}
		/>
	);
}
