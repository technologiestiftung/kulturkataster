"use client";

import { useTranslation } from "react-i18next";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export type InstitutionRowKindFilter = "all" | "submissions" | "institutions";

type InstitutionRowKindFilterToggleProps = {
	value: InstitutionRowKindFilter;
	onChange: (value: InstitutionRowKindFilter) => void;
};

export function InstitutionRowKindFilterToggle({
	value,
	onChange,
}: InstitutionRowKindFilterToggleProps) {
	const { t } = useTranslation();
	const label = t("content.institutionsTable.rowKindFilter.label", {
		defaultValue: "Einträge anzeigen",
	});
	const options: Array<{
		value: InstitutionRowKindFilter;
		label: string;
	}> = [
		{
			value: "all",
			label: t("content.institutionsTable.rowKindFilter.all", {
				defaultValue: "Alle",
			}),
		},
		{
			value: "submissions",
			label: t("content.institutionsTable.rowKindFilter.submissions", {
				defaultValue: "Einreichungen",
			}),
		},
		{
			value: "institutions",
			label: t("content.institutionsTable.rowKindFilter.institutions", {
				defaultValue: "Kulturorte",
			}),
		},
	];

	return (
		<Select
			value={value}
			onValueChange={(nextValue) => {
				onChange(nextValue as InstitutionRowKindFilter);
			}}
		>
			<SelectTrigger
				variant="pill"
				className="min-w-44 max-h-12"
				aria-label={label}
			>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem key={option.value} value={option.value}>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
