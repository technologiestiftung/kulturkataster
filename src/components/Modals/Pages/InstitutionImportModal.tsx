"use client";

import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";
import { FormWrapper } from "@/components/FormWrapper/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper/types";
import {
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
): Promise<InstitutionImportResponse> => {
	const body = new FormData();
	body.append("file", file);
	try {
		const response = await fetch(INSTITUTION_IMPORT_ENDPOINT, {
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

	const handleImport = async () => {
		if (!file) return;
		setIsImporting(true);
		const response = await uploadImportFile(file);
		setResult(response);
		setIsImporting(false);
		const hasWrittenRows =
			response.ok || Boolean(response.created || response.updated);
		if (hasWrittenRows) {
			triggerAccountRefresh(["institutions", "entityAudits"]);
		}
	};

	const actionFormConfig: FormWrapperConfig = {
		formId: "institution-import-form",
		fields: [
			{
				name: "file",
				label: t("content.importModal.fileLabel", {
					defaultValue: "CSV-Datei auswählen",
				}),
				type: "file",
				accept: ".csv,text/csv",
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
		onSubmit: () => handleImport(),
		submitDisabled: !file || isImporting,
		submitLabel: isImporting
			? t("content.importModal.importing", {
					defaultValue: "Import läuft …",
				})
			: t("content.importModal.submit", {
					defaultValue: "Importieren",
				}),
		showCancel: true,
		cancelLabel: result?.ok
			? t("common.close", { defaultValue: "Schließen" })
			: t("common.cancel", { defaultValue: "Abbrechen" }),
		onCancel: handleClose,
	};

	return (
		<Modal
			containerClassName="max-w-3xl"
			title={t("content.importModal.title", {
				defaultValue: "Kulturorte aus CSV importieren",
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
							"Laden Sie eine zuvor aus dem Kulturkataster exportierte CSV-Datei hoch. Orte mit ID werden aktualisiert, Zeilen ohne ID werden als neue Orte angelegt. Leere Zellen überschreiben bestehende Werte.",
					})}
				</p>
				<FormWrapper config={actionFormConfig} />
			</div>
		</Modal>
	);
}
