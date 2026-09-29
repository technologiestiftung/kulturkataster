"use client";

import { ActionPanel } from "@/components/ActionPanel";
import CheckCircle from "@/icons/check-circle.svg";
import Warning from "@/icons/warning.svg";
import type { InstitutionImportResponse } from "@/types/institutionImport";
import { useTranslation } from "react-i18next";
import { InstitutionImportIssueList } from "./InstitutionImportIssueList";

// A dry run reports what an import would write, so it reuses the success layout.
const SUMMARY_DEFAULTS = {
	preview: {
		title: "Prüfung erfolgreich",
		summary:
			"Beim Import werden {{updated}} Orte aktualisiert und {{created}} Orte neu angelegt, {{unchanged}} bleiben unverändert. Es wurde noch nichts gespeichert.",
	},
	success: {
		title: "Import abgeschlossen",
		summary:
			"{{updated}} Orte aktualisiert, {{created}} Orte neu angelegt, {{unchanged}} unverändert.",
	},
};

type InstitutionImportFeedbackProps = {
	result: InstitutionImportResponse | null;
};

export function InstitutionImportFeedback({
	result,
}: InstitutionImportFeedbackProps) {
	const { t } = useTranslation();
	if (!result) return null;

	if (result.ok) {
		const variant = result.dryRun ? "preview" : "success";
		return (
			<div role="status">
				<ActionPanel
					title={t(`content.importModal.${variant}.title`, {
						defaultValue: SUMMARY_DEFAULTS[variant].title,
					})}
					icon={<CheckCircle className="size-5" />}
					actionLabel=""
					actionLabelLoading=""
				>
					{t(`content.importModal.${variant}.summary`, {
						created: result.created,
						updated: result.updated,
						unchanged: result.unchanged,
						defaultValue: SUMMARY_DEFAULTS[variant].summary,
					})}
				</ActionPanel>
			</div>
		);
	}

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
					<InstitutionImportIssueList issues={result.issues} />
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
