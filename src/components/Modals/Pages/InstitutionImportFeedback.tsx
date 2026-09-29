"use client";

import { ActionPanel } from "@/components/ActionPanel";
import CheckCircle from "@/icons/check-circle.svg";
import Warning from "@/icons/warning.svg";
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
			<div role="status">
				<ActionPanel
					title={t("content.importModal.success.title", {
						defaultValue: "Import abgeschlossen",
					})}
					icon={<CheckCircle className="size-5" />}
					actionLabel=""
					actionLabelLoading=""
				>
					{t("content.importModal.success.summary", {
						created: result.created,
						updated: result.updated,
						unchanged: result.unchanged,
						defaultValue:
							"{{updated}} Orte aktualisiert, {{created}} Orte neu angelegt, {{unchanged}} unverändert.",
					})}
				</ActionPanel>
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
		<div role="alert">
			<ActionPanel
				title={t(`content.importModal.errors.${result.error}`, {
					count: result.issueCount ?? 0,
					created: result.created ?? 0,
					updated: result.updated ?? 0,
					defaultValue: t("content.importModal.errors.unexpected", {
						defaultValue: "Der Import ist fehlgeschlagen.",
					}),
				})}
				icon={<Warning className="size-5 text-destructive-secondary" />}
				className="border-destructive-secondary"
				actionLabel=""
				actionLabelLoading=""
			>
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
			</ActionPanel>
		</div>
	);
}
