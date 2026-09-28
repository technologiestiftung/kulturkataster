"use client";

import { triggerAccountRefresh } from "@/components/Account/AccountAutoRefresh";
import { FormWrapper } from "@/components/FormWrapper/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper/types";
import { Label } from "@/components/ui/label";
import {
	INSTITUTION_IMPORT_ENDPOINT,
	INSTITUTION_IMPORT_MAX_FILE_BYTES,
	type InstitutionImportResponse,
} from "@/types/institutionImport";
import { useId, useState } from "react";
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
	const fileInputId = useId();
	const [file, setFile] = useState<File | null>(null);
	const [isImporting, setIsImporting] = useState(false);
	const [result, setResult] = useState<InstitutionImportResponse | null>(null);

	const handleClose = () => {
		setFile(null);
		setResult(null);
		setIsImporting(false);
		onCloseRequest();
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0] ?? null;
		setResult(
			selectedFile && selectedFile.size > INSTITUTION_IMPORT_MAX_FILE_BYTES
				? { ok: false, error: "fileTooLarge" }
				: null,
		);
		setFile(selectedFile);
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

	const isFileTooLarge =
		result?.ok === false && result.error === "fileTooLarge";
	const actionFormConfig: FormWrapperConfig = {
		formId: "institution-import-actions-form",
		fields: [],
		onSubmit: () => handleImport(),
		submitDisabled: !file || isImporting || isFileTooLarge,
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
				<div className="flex flex-col gap-2">
					<Label htmlFor={fileInputId} className="body2 font-bold">
						{t("content.importModal.fileLabel", {
							defaultValue: "CSV-Datei auswählen",
						})}
					</Label>
					<input
						id={fileInputId}
						type="file"
						accept=".csv,text/csv"
						onChange={handleFileChange}
						disabled={isImporting}
						className="body2 file:mr-4 file:rounded-full file:border file:border-neutral-20 file:bg-neutral-5 file:px-4 file:py-2 file:font-bold"
					/>
				</div>
				<InstitutionImportFeedback result={result} />
				<FormWrapper config={actionFormConfig} />
			</div>
		</Modal>
	);
}
