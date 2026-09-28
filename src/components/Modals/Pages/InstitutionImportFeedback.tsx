"use client";

import type {
	ImportIssue,
	InstitutionImportResponse,
} from "@/types/institutionImport";
import { useTranslation } from "react-i18next";

type InstitutionImportFeedbackProps = {
	result: InstitutionImportResponse | null;
};

export function InstitutionImportFeedback({
	result,
}: InstitutionImportFeedbackProps) {
	const { t } = useTranslation();
	if (!result) return null;

	if (result.ok) {
		return (
			<div
				role="status"
				className="rounded-md border border-neutral-20 bg-neutral-5 p-4 body2"
			>
				<p className="font-bold">
					{t("content.importModal.success.title", {
						defaultValue: "Import abgeschlossen",
					})}
				</p>
				<p>
					{t("content.importModal.success.summary", {
						created: result.created,
						updated: result.updated,
						unchanged: result.unchanged,
						defaultValue:
							"{{updated}} Orte aktualisiert, {{created}} Orte neu angelegt, {{unchanged}} unverändert.",
					})}
				</p>
			</div>
		);
	}

	const formatIssue = (issue: ImportIssue) =>
		t("content.importModal.issue", {
			row: issue.row,
			column: issue.column,
			message: t(`content.importModal.issueCodes.${issue.code}`, {
				defaultValue: issue.code,
			}),
			defaultValue: "Zeile {{row}}, Spalte „{{column}}“: {{message}}",
		});
	const hiddenIssueCount =
		(result.issueCount ?? 0) - (result.issues?.length ?? 0);

	return (
		<div
			role="alert"
			className="rounded-md border border-destructive bg-neutral-5 p-4 body2"
		>
			<p className="font-bold">
				{t(`content.importModal.errors.${result.error}`, {
					count: result.issueCount ?? 0,
					created: result.created ?? 0,
					updated: result.updated ?? 0,
					defaultValue: t("content.importModal.errors.unexpected", {
						defaultValue: "Der Import ist fehlgeschlagen.",
					}),
				})}
			</p>
			{result.columns && result.columns.length > 0 && (
				<p>{result.columns.join(", ")}</p>
			)}
			{result.issues && result.issues.length > 0 && (
				<ul className="mt-2 list-disc pl-5">
					{result.issues.map((issue) => (
						<li key={`${issue.row}-${issue.column}`}>{formatIssue(issue)}</li>
					))}
				</ul>
			)}
			{hiddenIssueCount > 0 && (
				<p className="mt-2">
					{t("content.importModal.moreIssues", {
						count: hiddenIssueCount,
						defaultValue: "… und {{count}} weitere Fehler.",
					})}
				</p>
			)}
		</div>
	);
}
