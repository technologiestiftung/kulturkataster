"use client";

import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";
import { FormWrapper } from "@/components/FormWrapper/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper/types";
import {
	INSTITUTION_IMPORT_ACCEPT,
	INSTITUTION_IMPORT_ENDPOINT,
	INSTITUTION_IMPORT_MAX_FILE_BYTES,
	type InstitutionImportResponse,
} from "@/types/institutionImport";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal } from "../Modal";
import { InstitutionImportFeedback } from "./InstitutionImportFeedback";

type InstitutionImportModalProps = {
	open: boolean;
	onCloseRequest: () => void;
};

const uploadImportFile = async (
	file: File,
	isDryRun: boolean,
): Promise<InstitutionImportResponse> => {
	const body = new FormData();
	body.append("file", file);
	const url = isDryRun
		? `${INSTITUTION_IMPORT_ENDPOINT}?dryRun=true`
		: INSTITUTION_IMPORT_ENDPOINT;
	try {
		const response = await fetch(url, {
			method: "POST",
			body,
		});
		return (await response.json()) as InstitutionImportResponse;
	} catch {
		return { ok: false, error: "unexpected" };
	}
};

export function InstitutionImportModal({
	open,
	onCloseRequest,
}: InstitutionImportModalProps) {
	const { t } = useTranslation();
	const [file, setFile] = useState<File | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const [result, setResult] = useState<InstitutionImportResponse | null>(null);

	const handleClose = () => {
		setFile(null);
		setResult(null);
		setIsImporting(false);
		onCloseRequest();
	};

	// Every file is checked with a dry run first; only a successful check unlocks the import.
	const isChecked = result?.ok === true && result.dryRun;
	const isImported = result?.ok === true && !result.dryRun;

	const handleSubmit = async () => {
		if (!file) return;
		const isDryRun = !isChecked;
		setIsImporting(true);
		const response = await uploadImportFile(file, isDryRun);
		setResult(response);
		setIsImporting(false);
		if (isDryRun) return;
		const hasWrittenRows =
			response.ok || Boolean(response.created || response.updated);
		if (hasWrittenRows) {
			triggerAccountRefresh(["institutions", "entityAudits"]);
		}
	};

	const getSubmitLabel = () => {
		if (isImporting) {
			return isChecked
				? t("content.importModal.importing", {
						defaultValue: "Import läuft …",
					})
				: t("content.importModal.checking", {
						defaultValue: "Prüfung läuft …",
					});
		}
		return isChecked || isImported
			? t("content.importModal.submit", { defaultValue: "Importieren" })
			: t("content.importModal.check", { defaultValue: "Prüfen" });
	};

	const actionFormConfig: FormWrapperConfig = {
		formId: "institution-import-form",
		fields: [
			{
				name: "file",
				label: t("content.importModal.fileLabel", {
					defaultValue: "Datei auswählen",
				}),
				type: "file",
				accept: INSTITUTION_IMPORT_ACCEPT,
				required: true,
				disabled: isImporting,
				validators: [
					(value) =>
						value instanceof File &&
						value.size > INSTITUTION_IMPORT_MAX_FILE_BYTES
							? t("content.importModal.errors.fileTooLarge", {
									defaultValue: "Die Datei ist zu groß (maximal 10 MB).",
								})
							: undefined,
				],
			},
			{
				name: "result",
				type: "custom",
				customField: <InstitutionImportFeedback result={result} />,
			},
		],
		onChange: (data) => {
			const nextFile = data.file instanceof File ? data.file : null;
			if (nextFile === file) return;
			setFile(nextFile);
			setResult(null);
		},
		onSubmit: () => handleSubmit(),
		submitDisabled: !file || isImporting || isImported,
		submitLabel: getSubmitLabel(),
		showCancel: true,
		cancelLabel: isImported
			? t("common.close", { defaultValue: "Schließen" })
			: t("common.cancel", { defaultValue: "Abbrechen" }),
		onCancel: handleClose,
	};

	return (
		<Modal
			containerClassName="max-w-3xl"
			title={t("content.importModal.title", {
				defaultValue: "Kulturorte importieren",
			})}
			open={open}
			variant="centered"
			hasFooter={false}
			showBackButton={false}
			onCloseRequest={handleClose}
		>
			<div className="flex flex-col gap-6">
				<p className="body1">
					{t("content.importModal.description", {
						defaultValue:
							"Laden Sie eine zuvor aus dem Kulturkataster exportierte Datei (CSV oder XLSX) hoch. Orte mit ID werden aktualisiert, Zeilen ohne ID werden als neue Orte angelegt. Leere Zellen überschreiben bestehende Werte.",
					})}
				</p>
				<FormWrapper config={actionFormConfig} />
			</div>
		</Modal>
	);
}
