"use client";

import {
	formatRowRanges,
	groupImportIssues,
	type ImportIssueGroup,
} from "@/lib/utils/institutionImportIssues";
import type { ImportIssue } from "@/types/institutionImport";
import { useTranslation } from "react-i18next";

type InstitutionImportIssueListProps = {
	issues: ImportIssue[];
};

export function InstitutionImportIssueList({
	issues,
}: InstitutionImportIssueListProps) {
	const { t } = useTranslation();

	const formatGroup = ({ column, code, value, rows }: ImportIssueGroup) => {
		const problem = t(`content.importModal.issueCodes.${code}`, {
			defaultValue: code,
		});
		const message = value
			? t("content.importModal.issueValue", {
					message: problem,
					value,
					defaultValue: "{{message}} „{{value}}“",
				})
			: problem;
		const { text, hiddenCount } = formatRowRanges(rows);
		const rowText =
			hiddenCount > 0
				? t("content.importModal.moreRows", {
						rows: text,
						count: hiddenCount,
						defaultValue: "{{rows}} und {{count}} weitere",
					})
				: text;
		return t("content.importModal.issueGroup", {
			column,
			message,
			rows: rowText,
			count: rows.length,
			defaultValue: "Spalte „{{column}}“: {{message}} (Zeilen {{rows}})",
		});
	};

	const groups = groupImportIssues(issues);

	return (
		<ul className="mt-2 list-disc pl-5">
			{groups.map((group) => (
				<li key={`${group.column}-${group.code}-${group.value ?? ""}`}>
					{formatGroup(group)}
				</li>
			))}
		</ul>
	);
}
