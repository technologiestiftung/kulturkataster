"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import type { FormWrapperFieldConfig } from "./types";

type FundingSourceFormValue = {
	source_name: string;
	description: string;
};

type FundingSourceFieldProps = {
	field: FormWrapperFieldConfig;
	value: unknown;
	updateField: (name: string, value: unknown) => void;
};

const SELECT_NULL_SENTINEL = "__FORMWRAPPER_FUNDING_SOURCE_NULL__";

export function FundingSourceField({
	field,
	value,
	updateField,
}: FundingSourceFieldProps) {
	const { t: tEnum } = useTranslation("enumMap");

	if (field.type !== "fundingSources") {
		return null;
	}

	const items = Array.isArray(value) ? (value as FundingSourceFormValue[]) : [];
	const maxItems = field.fundingSources?.maxItems;
	const canAdd = typeof maxItems === "number" ? items.length < maxItems : true;
	const sourceLabel =
		field.fundingSources?.sourceLabel ?? "Funding Source Name";
	const descriptionLabel =
		field.fundingSources?.descriptionLabel ?? "Funding Source Description";
	const sourcePlaceholder = field.fundingSources?.sourcePlaceholder ?? "";
	const descriptionPlaceholder =
		field.fundingSources?.descriptionPlaceholder ?? "";
	const allowNullOption = field.allowNullOption === true;
	const nullOptionLabel =
		typeof field.nullOptionLabel === "string"
			? field.nullOptionLabel
			: tEnum("funding_source.none", {
					defaultValue: "Keine Angabe",
				});
	const addButtonLabel =
		field.fundingSources?.addButtonLabel ?? "Add funding source";
	const removeButtonLabel = field.fundingSources?.removeButtonLabel ?? "Remove";
	const fundingSourceOptions = [
		"church",
		"district",
		"eu",
		"federal",
		"foundation",
		"other",
		"private",
		"state_berlin",
	] as const;

	const updateItem = (
		index: number,
		key: keyof FundingSourceFormValue,
		nextValue: string,
	) => {
		const nextItems = [...items];
		const current = nextItems[index] ?? { source_name: "", description: "" };
		nextItems[index] = { ...current, [key]: nextValue };
		updateField(field.name, nextItems);
	};

	const addItem = () => {
		updateField(field.name, [...items, { source_name: "", description: "" }]);
	};

	const removeItem = (index: number) => {
		updateField(
			field.name,
			items.filter((_, itemIndex) => itemIndex !== index),
		);
	};

	return (
		<div className="space-y-3 flex flex-col">
			{items.map((item, index) => (
				<div
					key={`${field.name}-${index}`}
					className="rounded-md border border-input p-3 space-y-2"
				>
					<div className="space-y-1">
						<Label htmlFor={`${field.name}-${index}-source`}>
							{sourceLabel}
						</Label>
						<Select
							value={(() => {
								if (item.source_name && item.source_name.length > 0) {
									return item.source_name;
								}
								if (allowNullOption) {
									return SELECT_NULL_SENTINEL;
								}
								return "";
							})()}
							onValueChange={(nextValue) =>
								updateItem(
									index,
									"source_name",
									nextValue === SELECT_NULL_SENTINEL ? "" : nextValue,
								)
							}
							disabled={field.disabled}
						>
							<SelectTrigger id={`${field.name}-${index}-source`}>
								<SelectValue placeholder={sourcePlaceholder || sourceLabel} />
							</SelectTrigger>
							<SelectContent>
								{allowNullOption && (
									<>
										<SelectItem value={SELECT_NULL_SENTINEL}>
											{nullOptionLabel}
										</SelectItem>
									</>
								)}
								{fundingSourceOptions.map((option) => (
									<SelectItem key={option} value={option}>
										{tEnum(`funding_source.${option}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1">
						<Label htmlFor={`${field.name}-${index}-description`}>
							{descriptionLabel}
						</Label>
						<Textarea
							id={`${field.name}-${index}-description`}
							value={item.description ?? ""}
							onChange={(event) =>
								updateItem(index, "description", event.target.value)
							}
							placeholder={descriptionPlaceholder}
							disabled={field.disabled}
							rows={3}
						/>
					</div>
					<div className="flex items-center justify-start">
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => removeItem(index)}
							disabled={field.disabled}
						>
							{removeButtonLabel}
						</Button>
					</div>
				</div>
			))}
			{canAdd && (
				<Button
					type="button"
					variant="outline"
					onClick={addItem}
					disabled={field.disabled}
				>
					{addButtonLabel}
				</Button>
			)}
		</div>
	);
}
