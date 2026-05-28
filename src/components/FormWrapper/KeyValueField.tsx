"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormWrapperFieldConfig } from "./types";

type KeyValueEntry = { key: string; value: string };

const parseValue = (raw: unknown): KeyValueEntry[] => {
	if (!raw) return [];
	if (typeof raw === "string") {
		if (!raw.trim()) return [];
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				return Object.entries(parsed as Record<string, unknown>).map(
					([k, v]) => ({
						key: k,
						value: typeof v === "string" ? v : JSON.stringify(v),
					}),
				);
			}
		} catch {
			// not valid JSON
		}
		return [];
	}
	if (typeof raw === "object" && !Array.isArray(raw)) {
		return Object.entries(raw as Record<string, unknown>).map(([k, v]) => ({
			key: k,
			value: typeof v === "string" ? v : JSON.stringify(v),
		}));
	}
	return [];
};

const toJsonObject = (entries: KeyValueEntry[]): Record<string, string> => {
	return Object.fromEntries(
		entries.filter((e) => e.key.trim()).map((e) => [e.key.trim(), e.value]),
	);
};

type KeyValueFieldProps = {
	field: FormWrapperFieldConfig;
	value: unknown;
	updateField: (name: string, value: unknown) => void;
};

export function KeyValueField({
	field,
	value,
	updateField,
}: KeyValueFieldProps) {
	if (field.type !== "keyValue") return null;

	const entries = parseValue(value);
	const keyPlaceholder = field.keyValue?.keyPlaceholder ?? "Key";
	const valuePlaceholder = field.keyValue?.valuePlaceholder ?? "Value";
	const addButtonLabel = field.keyValue?.addButtonLabel ?? "Add";
	const removeButtonLabel = field.keyValue?.removeButtonLabel ?? "Remove";
	const allowAdd = field.keyValue?.allowAdd ?? true;
	const keyReadOnly = field.keyValue?.keyReadOnly ?? false;
	const keyLabels = field.keyValue?.keyLabels ?? {};

	const updateEntry = (index: number, part: "key" | "value", val: string) => {
		const next = entries.map((e, i) =>
			i === index ? { ...e, [part]: val } : e,
		);
		updateField(field.name, toJsonObject(next));
	};

	const addEntry = () => {
		updateField(field.name, toJsonObject([...entries, { key: "", value: "" }]));
	};

	const removeEntry = (index: number) => {
		updateField(
			field.name,
			toJsonObject(entries.filter((_, i) => i !== index)),
		);
	};

	return (
		<div className="space-y-2">
			{entries.map((entry, index) => (
				<div
					key={index}
					className={`${keyReadOnly ? "flex-col items-start" : ""} flex gap-2 items-center`}
				>
					{keyReadOnly ? (
						<Label className="body2 text-neutral-80">
							{keyLabels[entry.key] ?? entry.key}
						</Label>
					) : (
						<Input
							className="w-2/5"
							placeholder={keyPlaceholder}
							value={entry.key}
							disabled={field.disabled}
							onChange={(e) => updateEntry(index, "key", e.target.value)}
						/>
					)}
					<Input
						className={keyReadOnly ? "" : "w-2/5"}
						placeholder={valuePlaceholder}
						value={entry.value}
						disabled={field.disabled}
						onChange={(e) => updateEntry(index, "value", e.target.value)}
					/>
					{!keyReadOnly && (
						<Button
							type="button"
							variant="outline"
							disabled={field.disabled}
							className="w-1/5"
							onClick={() => removeEntry(index)}
						>
							{removeButtonLabel}
						</Button>
					)}
				</div>
			))}
			{allowAdd && (
				<Button
					type="button"
					variant="outline"
					onClick={addEntry}
					disabled={field.disabled}
				>
					{addButtonLabel}
				</Button>
			)}
		</div>
	);
}
