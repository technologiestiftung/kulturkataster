"use client";

import { Fragment, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LikertScale } from "@/components/ui/likert-scale";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionWrapper } from "@/components/shared/SectionWrapper";
import {
	getGridClass,
	getResponsiveGridClass,
	getSpanClass,
} from "@/components/shared/sectionLayout";
import { CategorySectionList } from "@/components/Filter/CategorySection/CategorySectionList";
import { MultiSelectModal } from "@/components/MultiSelect/MultiSelectModal";
import { ActionPanel } from "@/components/ActionPanel";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { buildStreetLine, toOptionalNumber } from "@/lib/utils/formUtils";
import type { FilterState } from "@/types";
import type {
	FormWrapperFieldConfig,
	FormWrapperConfig,
	PermissionAction,
	PermissionScope,
	SelectOption,
	TablePermissionValue,
} from "./types";

const AddressMapField = dynamic(
	() =>
		import("./AddressMapField").then((m) => ({ default: m.AddressMapField })),
	{ ssr: false },
);
import { FundingSourceField } from "./FundingSourceField";
import { KeyValueField } from "./KeyValueField";
import { FieldPermissionsField } from "./FieldPermissionsField";
import { defaultFilterState } from "./constants";
import Eye from "@/icons/eye.svg";
import EyeOff from "@/icons/eye-off.svg";
import Warning from "@/icons/warning.svg";
import { PrivateBadge } from "@/components/shared/PrivateBadge";
import {
	getFieldDescription,
	getFieldLabel,
	getFieldPlaceholder,
} from "@/lib/i18n/fieldLabels";
import { ScrollReveal } from "@/components/shared/ScrollReveal";

function PasswordField({
	id,
	value,
	onChange,
	onBlur,
	placeholder,
	disabled,
	hasIssue,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	onBlur: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	hasIssue?: boolean;
}) {
	const [showPassword, setShowPassword] = useState(false);
	const { t } = useTranslation();

	return (
		<div className="relative">
			<Input
				id={id}
				type={showPassword ? "text" : "password"}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onBlur={(e) => onBlur(e.target.value)}
				placeholder={placeholder}
				disabled={disabled}
				aria-invalid={hasIssue || undefined}
				className={cn(
					"pr-12",
					hasIssue &&
						"bg-destructive-secondary/20 border-destructive-secondary pr-10",
				)}
			/>

			<button
				type="button"
				className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-80 hover:text-neutral-100"
				aria-label={
					showPassword
						? t("common.auth.password.hide")
						: t("common.auth.password.show")
				}
				onClick={() => setShowPassword((prev) => !prev)}
				disabled={disabled}
			>
				{showPassword ? (
					<EyeOff className="h-5 w-5" />
				) : (
					<Eye className="h-5 w-5" />
				)}
			</button>
			{hasIssue && (
				<Warning className="pointer-events-none absolute right-11 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive-secondary" />
			)}
		</div>
	);
}

function RadioFreeTextField({
	field,
	option,
	isSelected,
	formData,
	updateField,
}: {
	field: FormWrapperFieldConfig;
	option: SelectOption;
	isSelected: boolean;
	formData: Record<string, unknown>;
	updateField: (name: string, value: unknown) => void;
}) {
	if (field.type !== "radio" || !field.freeTextOption || !isSelected) {
		return null;
	}
	if (
		serializeOptionValue(field.freeTextOption.value) !==
		serializeOptionValue(option.value)
	) {
		return null;
	}

	const freeTextFieldName =
		field.freeTextOption.fieldName ?? `${field.name}FreeText`;

	return (
		<Input
			id={`${field.name}-freeText`}
			value={(formData[freeTextFieldName] as string) ?? ""}
			onChange={(e) => updateField(freeTextFieldName, e.target.value)}
			placeholder={field.freeTextOption.placeholder}
			aria-label={
				field.freeTextOption.label ??
				(typeof option.label === "string" ? option.label : undefined)
			}
			disabled={field.disabled}
			className="h-9 max-w-128"
		/>
	);
}

function MultiSelectFreeTextField({
	field,
	option,
	value,
	formData,
	updateField,
}: {
	field: FormWrapperFieldConfig;
	option: SelectOption;
	value: unknown;
	formData: Record<string, unknown>;
	updateField: (name: string, value: unknown) => void;
}) {
	if (field.type !== "multiselect" || !field.freeTextOption) {
		return null;
	}
	if (
		serializeOptionValue(field.freeTextOption.value) !==
		serializeOptionValue(option.value)
	) {
		return null;
	}
	const isChecked = ((value as string[]) ?? []).includes(
		option.value as string,
	);
	if (!isChecked) return null;

	const freeTextFieldName =
		field.freeTextOption.fieldName ?? `${field.name}FreeText`;

	return (
		<Input
			id={`${field.name}-freeText`}
			value={(formData[freeTextFieldName] as string) ?? ""}
			onChange={(e) => updateField(freeTextFieldName, e.target.value)}
			placeholder={field.freeTextOption.placeholder}
			aria-label={
				field.freeTextOption.label ??
				(typeof option.label === "string" ? option.label : undefined)
			}
			disabled={field.disabled}
			className="h-9 max-w-48"
		/>
	);
}

const normalizeTablePermissionValue = (
	currentValue: Record<string, TablePermissionValue | PermissionAction[]>,
): Record<string, TablePermissionValue> => {
	const nextValue: Record<string, TablePermissionValue> = {};
	Object.entries(currentValue).forEach(([key, value]) => {
		if (Array.isArray(value)) {
			nextValue[key] = { actions: value, scope: "own" };
			return;
		}
		nextValue[key] = { actions: [...value.actions], scope: value.scope };
	});
	return nextValue;
};

const toggleTablePermissionValue = (
	currentValue: Record<string, TablePermissionValue | PermissionAction[]>,
	key: string,
	action: PermissionAction,
	defaultScope: PermissionScope = "own",
) => {
	const nextValue = normalizeTablePermissionValue(currentValue);
	const current = nextValue[key] ?? { actions: [], scope: defaultScope };
	const actions = new Set(current.actions);
	if (actions.has(action)) {
		actions.delete(action);
	} else {
		actions.add(action);
	}
	const nextActions = Array.from(actions);
	if (nextActions.length === 0) {
		delete nextValue[key];
	} else {
		nextValue[key] = { actions: nextActions, scope: current.scope };
	}
	return nextValue;
};

const setTablePermissionScope = (
	currentValue: Record<string, TablePermissionValue | PermissionAction[]>,
	key: string,
	scope: PermissionScope,
) => {
	const nextValue = normalizeTablePermissionValue(currentValue);
	const current = nextValue[key] ?? { actions: [], scope };
	nextValue[key] = { actions: [...current.actions], scope };
	return nextValue;
};

const serializeOptionValue = (value: string | number | boolean): string => {
	if (typeof value === "string") return value;
	return `${typeof value}:${String(value)}`;
};

const SELECT_NULL_SENTINEL = "__FORMWRAPPER_SELECT_NULL__";

const deserializeOptionValue = (value: string): string | number | boolean => {
	if (value.startsWith("boolean:")) {
		return value.slice("boolean:".length) === "true";
	}
	if (value.startsWith("number:")) {
		const rawValue = value.slice("number:".length);
		const parsed = Number(rawValue);
		return Number.isFinite(parsed) ? parsed : rawValue;
	}
	return value;
};

const getSerializedSelectedValue = (
	options: Array<{ value: string | number | boolean }> | undefined,
	currentValue: unknown,
	allowNullSelection = false,
): string | undefined => {
	if (currentValue === undefined) return undefined;
	if (currentValue === null) {
		return allowNullSelection ? SELECT_NULL_SENTINEL : undefined;
	}
	if (!options || options.length === 0) return String(currentValue);

	const matchingOption = options.find(
		(option) => option.value === currentValue,
	);
	if (matchingOption) return serializeOptionValue(matchingOption.value);

	if (typeof currentValue === "string") return currentValue;

	return undefined;
};

type RenderFieldContentArgs = {
	field: FormWrapperFieldConfig;
	tEnum: TFunction;
	tCommon: TFunction;
	selectPlaceholder: string;
	formData: Record<string, unknown>;
	errors: Record<string, string>;
	touched: Record<string, boolean>;
	config: FormWrapperConfig;
	updateField: (name: string, value: unknown) => void;
	handleFieldBlur: (
		field: FormWrapperFieldConfig,
		nextValue: unknown,
	) => void | Promise<void>;
	isPrivate: boolean;
};

const renderFieldContent = (
	{
		field,
		tEnum,
		tCommon,
		selectPlaceholder,
		formData,
		errors,
		touched,
		updateField,
		handleFieldBlur,
		isPrivate,
	}: RenderFieldContentArgs,
	includeLayout = true,
) => {
	const value = formData[field.name];
	const error = touched[field.name] ? errors[field.name] : undefined;
	const hasWarning =
		!error &&
		Boolean(field.afterField) &&
		(field.name === "name" || field.name === "address.streetLine");
	const hasIssue = Boolean(error || hasWarning);
	const allowNullOption =
		field.type !== "section" && field.allowNullOption === true;

	const fieldMetaKey =
		field.type === "section" ? field.name : (field.fieldMetaKey ?? field.name);
	const nullOptionLabel =
		field.type !== "section"
			? (field.nullOptionLabel ?? getFieldPlaceholder(tEnum, fieldMetaKey))
			: undefined;
	const resolvedLabel = (() => {
		if (field.type === "section") return field.label;
		if (field.label === null) return null;
		return field.label ?? getFieldLabel(tEnum, fieldMetaKey);
	})();
	const resolvedDescription =
		field.type === "section"
			? field.description
			: (field.description ?? getFieldDescription(tEnum, fieldMetaKey));
	const resolvedPrivateDescription =
		field.privateDescription ??
		tCommon("common.privateFieldDescription", {
			defaultValue:
				"Diese Information wird ausschließlich für befugte Nutzer*innen im geschützten Bereich des Kulturkatasters zugänglich und nicht öffentlich einsehbar sein.",
		});
	const resolvedPlaceholder =
		field.type === "section"
			? undefined
			: (field.placeholder ?? getFieldPlaceholder(tEnum, fieldMetaKey));

	const gridClass = getGridClass(field);

	return (
		<div
			className={cn(
				"space-y-1",
				includeLayout && gridClass,
				includeLayout && field.className,
			)}
		>
			{(resolvedLabel || field.labelNode) &&
				field.type !== "checkbox" &&
				field.type !== "switch" &&
				field.type !== "tablePermissions" &&
				field.type !== "fieldPermissions" &&
				field.type !== "custom" && (
					<div className="flex items-center justify-between gap-2">
						<Label htmlFor={field.name} className="text-neutral-80">
							{field.labelNode ?? resolvedLabel}
							{field.required && !field.hideRequiredIndicator && (
								<span className="ml-1">*</span>
							)}
						</Label>
						{isPrivate ? (
							<PrivateBadge hoverDescription={resolvedPrivateDescription} />
						) : null}
					</div>
				)}

			{resolvedDescription &&
				field.type !== "tablePermissions" &&
				field.type !== "fieldPermissions" && (
					<p className="body2 text-neutral-80 mb-2">{resolvedDescription}</p>
				)}
			{isPrivate &&
				field.type !== "tablePermissions" &&
				field.type !== "fieldPermissions" && (
					<p className="body3 text-neutral-80 mb-2 italic">
						{resolvedPrivateDescription}
					</p>
				)}

			{(field.type === "text" ||
				field.type === "email" ||
				field.type === "number" ||
				field.type === "tel" ||
				field.type === "url" ||
				field.type === "date") && (
				<div className="relative">
					<Input
						id={field.name}
						type={field.type}
						value={value === undefined || value === null ? "" : String(value)}
						onChange={(e) => updateField(field.name, e.target.value)}
						onBlur={(e) => {
							void handleFieldBlur(field, e.target.value);
						}}
						placeholder={resolvedPlaceholder}
						disabled={field.disabled}
						min={field.min}
						max={field.max}
						step={field.step}
						aria-invalid={hasIssue || undefined}
						className={cn(
							hasIssue &&
								"bg-destructive-secondary/20 border-destructive-secondary pr-10",
						)}
					/>

					{hasIssue && (
						<Warning className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive-secondary" />
					)}
				</div>
			)}

			{field.type === "file" && (
				<div className="space-y-2">
					<div className="relative">
						<Input
							id={field.name}
							type="file"
							accept={field.accept}
							multiple={field.multiple}
							onChange={(event) => {
								const nextValue = field.multiple
									? Array.from(event.target.files ?? [])
									: (event.target.files?.[0] ?? null);
								updateField(field.name, nextValue);
								if (field.fileRemoveOption?.fieldName && nextValue) {
									updateField(field.fileRemoveOption.fieldName, false);
								}
								void handleFieldBlur(field, nextValue);
							}}
							disabled={field.disabled}
							aria-invalid={hasIssue || undefined}
							className={cn(
								hasIssue &&
									"bg-destructive-secondary/20 border-destructive-secondary pr-10",
							)}
						/>

						{hasIssue && (
							<Warning className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-destructive-secondary" />
						)}
					</div>
					{field.fileRemoveOption ? (
						<div className="flex items-start space-x-2">
							<Checkbox
								id={`${field.name}-remove`}
								checked={formData[field.fileRemoveOption.fieldName] as boolean}
								aria-invalid={hasIssue || undefined}
								onCheckedChange={(checked) =>
									updateField(field.fileRemoveOption!.fieldName, checked)
								}
								disabled={field.disabled}
							/>

							<Label htmlFor={`${field.name}-remove`} emphasize={false}>
								{field.fileRemoveOption.label}
							</Label>
						</div>
					) : null}
					{value instanceof File ? (
						<p className="body3 text-muted-foreground">{value.name}</p>
					) : null}
					{Array.isArray(value) &&
					value.every((item) => item instanceof File) ? (
						<p className="body3 text-muted-foreground">
							{value.map((file) => file.name).join(", ")}
						</p>
					) : null}
				</div>
			)}

			{field.type === "password" && (
				<PasswordField
					id={field.name}
					value={(value as string) ?? ""}
					onChange={(val) => updateField(field.name, val)}
					onBlur={(val) => {
						void handleFieldBlur(field, val);
					}}
					placeholder={resolvedPlaceholder}
					disabled={field.disabled}
					hasIssue={hasIssue}
				/>
			)}

			{field.type === "textarea" && (
				<div className="relative">
					<Textarea
						id={field.name}
						value={value === undefined || value === null ? "" : String(value)}
						onChange={(e) => updateField(field.name, e.target.value)}
						onBlur={(e) => {
							void handleFieldBlur(field, e.target.value);
						}}
						placeholder={resolvedPlaceholder}
						disabled={field.disabled}
						aria-invalid={hasIssue || undefined}
						rows={4}
						className={cn(
							hasIssue &&
								"bg-destructive-secondary/20 border-destructive-secondary pr-10",
						)}
					/>

					{hasIssue && (
						<Warning className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-destructive-secondary" />
					)}
				</div>
			)}

			{field.type === "select" && (
				<div className="relative">
					<Select
						value={getSerializedSelectedValue(
							field.options,
							value,
							allowNullOption,
						)}
						onValueChange={(val) => {
							if (val === SELECT_NULL_SENTINEL) {
								updateField(field.name, null);
								return;
							}
							updateField(field.name, deserializeOptionValue(val));
						}}
						disabled={field.disabled}
					>
						<SelectTrigger
							id={field.name}
							aria-invalid={hasIssue || undefined}
							className={cn(
								hasIssue &&
									"bg-destructive-secondary/20 border-destructive-secondary pr-12",
							)}
						>
							<SelectValue
								placeholder={resolvedPlaceholder || selectPlaceholder}
							/>
						</SelectTrigger>
						<SelectContent className="px-3">
							{allowNullOption && (
								<>
									<SelectItem value={SELECT_NULL_SENTINEL}>
										{nullOptionLabel}
									</SelectItem>
									{(field.options?.length ?? 0) > 0 && <SelectSeparator />}
								</>
							)}
							{field.options?.map((option, index) => (
								<Fragment key={serializeOptionValue(option.value)}>
									<SelectItem value={serializeOptionValue(option.value)}>
										{option.label}
									</SelectItem>
									{index < (field.options?.length || 0) - 1 && (
										<SelectSeparator />
									)}
								</Fragment>
							))}
						</SelectContent>
					</Select>
					{hasIssue && (
						<Warning className="pointer-events-none absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive-secondary" />
					)}
				</div>
			)}

			{field.type === "radio" && (
				<RadioGroup
					value={getSerializedSelectedValue(
						field.options,
						value,
						allowNullOption,
					)}
					onValueChange={(val) => {
						if (val === SELECT_NULL_SENTINEL) {
							updateField(field.name, null);
							return;
						}
						updateField(field.name, deserializeOptionValue(val));
					}}
					aria-invalid={hasIssue || undefined}
					className={cn(
						hasIssue &&
							"rounded-sm border border-destructive-secondary bg-destructive-secondary/10 p-3",
					)}
					variant={field.radioVariant}
					disabled={field.disabled}
				>
					{allowNullOption && (
						<div className="flex items-start space-x-2">
							<RadioGroupItem
								className={cn(
									"bg-background border-input",
									hasIssue && "border-destructive-secondary",
								)}
								value={SELECT_NULL_SENTINEL}
								id={`${field.name}-${SELECT_NULL_SENTINEL}`}
								aria-invalid={hasIssue || undefined}
							/>

							<Label
								htmlFor={`${field.name}-${SELECT_NULL_SENTINEL}`}
								emphasize={false}
							>
								{nullOptionLabel}
							</Label>
						</div>
					)}
					{field.options?.map((option) => {
						const serializedOptionValue = serializeOptionValue(option.value);
						const isSelected =
							getSerializedSelectedValue(
								field.options,
								value,
								allowNullOption,
							) === serializedOptionValue;
						// items-start keeps the radio dot aligned to a wrapping multi-line
						// label's first line — but once this option's free-text input
						// renders inline (taller than the label), centering looks right.
						const showsFreeText =
							isSelected &&
							field.freeTextOption &&
							serializeOptionValue(field.freeTextOption.value) ===
								serializedOptionValue;

						return (
							<div
								key={serializedOptionValue}
								className={cn(
									"flex space-x-2",
									showsFreeText ? "items-center" : "items-start",
								)}
							>
								<RadioGroupItem
									className={cn(
										"bg-background border-input",
										hasIssue && "border-destructive-secondary",
									)}
									value={serializedOptionValue}
									id={`${field.name}-${serializedOptionValue}`}
									aria-invalid={hasIssue || undefined}
								/>

								<Label
									htmlFor={`${field.name}-${serializedOptionValue}`}
									emphasize={false}
								>
									{option.label}
								</Label>

								<RadioFreeTextField
									field={field}
									option={option}
									isSelected={isSelected}
									formData={formData}
									updateField={updateField}
								/>
							</div>
						);
					})}
				</RadioGroup>
			)}

			{field.type === "likert" && (
				<div
					className={cn(
						hasIssue &&
							"rounded-sm border border-destructive-secondary bg-destructive-secondary/10 p-3",
					)}
				>
					<LikertScale
						value={getSerializedSelectedValue(field.options, value)}
						onValueChange={(val) =>
							updateField(field.name, deserializeOptionValue(val))
						}
						options={
							field.options?.map((option) => ({
								value: serializeOptionValue(option.value),
								label: option.label,
							})) ?? []
						}
						aria-invalid={hasIssue || undefined}
						itemClassName={cn(hasIssue && "border-destructive-secondary")}
						disabled={field.disabled}
					/>
				</div>
			)}

			{field.type === "likertMatrix" && field.likertMatrix && (
				<div
					className={cn(
						"space-y-6",
						hasIssue &&
							"rounded-sm border border-destructive-secondary bg-destructive-secondary/10 p-3",
					)}
				>
					{field.likertMatrix.rows.map((row) => {
						const rowValue =
							(value as Record<string, unknown> | undefined)?.[row.key] ?? "";
						return (
							<div key={row.key} className="space-y-2">
								<Label className="text-neutral-80">{row.label}</Label>
								<LikertScale
									value={getSerializedSelectedValue(field.options, rowValue)}
									onValueChange={(val) =>
										updateField(field.name, {
											...(value as Record<string, unknown> | undefined),
											[row.key]: deserializeOptionValue(val),
										})
									}
									options={
										field.options?.map((option) => ({
											value: serializeOptionValue(option.value),
											label: option.label,
										})) ?? []
									}
									aria-invalid={hasIssue || undefined}
									itemClassName={cn(hasIssue && "border-destructive-secondary")}
									disabled={field.disabled}
								/>
							</div>
						);
					})}
				</div>
			)}

			{field.type === "checkbox" && (
				<div
					className={cn(
						"flex items-start space-x-2",
						hasIssue &&
							"rounded-sm border border-destructive-secondary bg-destructive-secondary/10 p-2",
					)}
				>
					<Checkbox
						id={field.name}
						checked={value as boolean}
						aria-invalid={hasIssue || undefined}
						onCheckedChange={(checked) => updateField(field.name, checked)}
						disabled={field.disabled}
					/>

					<Label htmlFor={field.name} emphasize={false}>
						{field.labelNode ?? resolvedLabel}
						{field.required && !field.hideRequiredIndicator && (
							<span className=" ml-1">*</span>
						)}
					</Label>
					{isPrivate ? (
						<PrivateBadge hoverDescription={resolvedPrivateDescription} />
					) : null}
				</div>
			)}

			{field.type === "switch" && (
				<div
					className={cn(
						"flex items-center justify-between",
						hasIssue &&
							"rounded-sm border border-destructive-secondary bg-destructive-secondary/10 p-2",
					)}
				>
					<Label htmlFor={field.name} className="font-normal">
						{field.labelNode ?? resolvedLabel}
						{field.required && !field.hideRequiredIndicator && (
							<span className=" ml-1">*</span>
						)}
					</Label>
					{isPrivate ? (
						<PrivateBadge hoverDescription={resolvedPrivateDescription} />
					) : null}
					<Switch
						id={field.name}
						checked={value as boolean}
						aria-invalid={hasIssue || undefined}
						className={cn(hasIssue && "border-destructive-secondary")}
						onCheckedChange={(checked) => updateField(field.name, checked)}
						disabled={field.disabled}
					/>
				</div>
			)}

			{field.type === "multiselect" && (
				<div
					className={cn(
						"space-y-2",
						hasIssue &&
							"rounded-sm border border-destructive-secondary bg-destructive-secondary/10 p-2",
					)}
				>
					{field.multiselectVariant === "modal" ? (
						<MultiSelectModal
							title={resolvedLabel || "Select Items"}
							options={field.options ?? []}
							filteredOptions={field.multiselectFilteredOptions}
							selected={(value as string[]) ?? []}
							onChange={(selected) => updateField(field.name, selected)}
							placeholder={resolvedPlaceholder}
							searchPlaceholder={field.searchPlaceholder}
							emptyText={field.emptyText}
							previewCount={field.previewCount}
							filterPanel={field.multiselectFilterPanel}
							filters={field.multiselectFilters?.map((filter) => ({
								...filter,
								options: filter.options.map((option) => ({
									value: option.value,
									description: option.description,
									label: option.label,
									parentValue: option.parentValue,
								})),
							}))}
							sortOptions={field.multiselectSortOptions}
							disabled={field.disabled}
						/>
					) : (
						field.options?.map((option) => {
							const isChecked =
								(value as string[])?.includes(option.value as string) ?? false;
							const showsFreeText =
								isChecked &&
								field.freeTextOption &&
								serializeOptionValue(field.freeTextOption.value) ===
									serializeOptionValue(option.value);

							return (
								<div
									key={option.value as string}
									className={cn(
										"flex space-x-2",
										showsFreeText ? "items-center" : "items-start",
									)}
								>
									<Checkbox
										id={`${field.name}-${option.value}`}
										checked={isChecked}
										onCheckedChange={(checked) => {
											const currentValue = (value as string[]) || [];
											const newValue = checked
												? [...currentValue, option.value]
												: currentValue.filter((v: string) => v !== option.value);
											updateField(field.name, newValue);
										}}
										disabled={field.disabled}
									/>

									<Label
										htmlFor={`${field.name}-${option.value}`}
										className="font-normal"
										emphasize={false}
									>
										{option.label}
									</Label>

									<MultiSelectFreeTextField
										field={field}
										option={option}
										value={value}
										formData={formData}
										updateField={updateField}
									/>
								</div>
							);
						})
					)}
				</div>
			)}

			{field.type === "filterPanel" && field.filterPanel && (
				<CategorySectionList
					filters={(value as FilterState) ?? defaultFilterState}
					categoryGroups={field.filterPanel.categoryGroups}
					categoryCounts={field.filterPanel.categoryCounts}
					subcategoryCounts={field.filterPanel.subcategoryCounts}
					onFiltersChange={(nextFilters) =>
						updateField(field.name, nextFilters)
					}
					collapsible={field.filterPanel.collapsible}
					defaultCollapsed={field.filterPanel.defaultCollapsed}
					categorySectionMode={field.filterPanel.categorySectionMode}
					parentCategorySelectionBehavior={
						field.filterPanel.parentCategorySelectionBehavior
					}
					selectionEmptyLabel={field.filterPanel.selectionEmptyLabel}
				/>
			)}

			{field.type === "addressMap" && field.addressMap && (
				<AddressMapField
					initialZoom={field.addressMap.initialZoom}
					disabled={field.disabled}
					value={{
						lat: toOptionalNumber(formData[field.addressMap.latField]) ?? null,
						lng: toOptionalNumber(formData[field.addressMap.lngField]) ?? null,
					}}
					onChange={({ lat, lng, address }) => {
						if (!field.addressMap) return;
						updateField(field.addressMap.latField, lat);
						updateField(field.addressMap.lngField, lng);

						if (address) {
							if (field.addressMap.streetField) {
								if (field.addressMap.streetNumberField) {
									if (address.street !== undefined) {
										updateField(field.addressMap.streetField, address.street);
									}
									if (address.streetNumber !== undefined) {
										updateField(
											field.addressMap.streetNumberField,
											address.streetNumber,
										);
									}
								} else {
									updateField(
										field.addressMap.streetField,
										buildStreetLine(address.street, address.streetNumber),
									);
								}
							}
							if (field.addressMap.cityField && address.city !== undefined) {
								updateField(field.addressMap.cityField, address.city);
							}
							if (field.addressMap.zipField && address.zipcode !== undefined) {
								updateField(field.addressMap.zipField, address.zipcode);
							}
							if (
								field.addressMap.districtField &&
								address.district !== undefined
							) {
								updateField(field.addressMap.districtField, address.district);
							}
							if (
								field.addressMap.neighbourhoodField &&
								address.neighbourhood !== undefined
							) {
								updateField(
									field.addressMap.neighbourhoodField,
									address.neighbourhood,
								);
							}
						}
					}}
				/>
			)}

			{field.type === "fundingSources" && (
				<FundingSourceField
					field={field}
					value={value}
					updateField={updateField}
				/>
			)}

			{field.type === "keyValue" && (
				<KeyValueField field={field} value={value} updateField={updateField} />
			)}

			{field.type === "actionPanel" && field.actionPanel && (
				<ActionPanel
					title={field.actionPanel.title}
					actionLabel={field.actionPanel.actionLabel}
					actionLabelLoading={field.actionPanel.actionLabelLoading}
					onAction={field.actionPanel.onAction}
					secondaryActionLabel={field.actionPanel.secondaryActionLabel}
					secondaryActionLabelLoading={
						field.actionPanel.secondaryActionLabelLoading
					}
					onSecondaryAction={field.actionPanel.onSecondaryAction}
					errorFallback={field.actionPanel.errorFallback}
					secondaryErrorFallback={field.actionPanel.secondaryErrorFallback}
					icon={field.actionPanel.icon}
					className={field.actionPanel.className}
				>
					{field.actionPanel.description}
				</ActionPanel>
			)}

			{field.type === "custom" && field.customField}

			{field.type === "tablePermissions" && field.tablePermissions && (
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between gap-2">
						<Label className="">{field.label}</Label>
						{isPrivate ? (
							<PrivateBadge hoverDescription={resolvedPrivateDescription} />
						) : null}
					</div>
					<div className="mt-4 grid gap-4">
						{field.tablePermissions.tables.map((table) => (
							<div
								key={table.key}
								className="rounded-sm border border-input bg-background p-4"
							>
								{(() => {
									const permissionValue =
										(value as Record<
											string,
											TablePermissionValue | PermissionAction[]
										>) ?? {};
									const normalizedValue =
										normalizeTablePermissionValue(permissionValue);
									const currentTable = normalizedValue[table.key];
									const actions = table.actions ??
										field.tablePermissions?.actions ?? [
											"read",
											"create",
											"update",
											"delete",
										];

									return (
										<>
											<p className="body3 ">{table.label}</p>
											<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
												{actions.map((action) => {
													const checkboxId = `${field.name}-${table.key}-${action}`;
													const isChecked = Boolean(
														currentTable?.actions?.includes(action),
													);
													return (
														<div
															key={action}
															className="flex items-center gap-2"
														>
															<Checkbox
																id={checkboxId}
																checked={isChecked}
																onCheckedChange={() =>
																	updateField(
																		field.name,
																		toggleTablePermissionValue(
																			permissionValue,
																			table.key,
																			action,
																		),
																	)
																}
																disabled={field.disabled}
															/>

															<Label
																htmlFor={checkboxId}
																className="capitalize"
															>
																{field.tablePermissions?.actionLabels?.[action]}
															</Label>
														</div>
													);
												})}
											</div>
											{field.tablePermissions?.scopeOptions && (
												<div className="mt-4 flex flex-wrap items-center gap-2 justify-end">
													<Label
														htmlFor={`${field.name}-${table.key}-scope`}
														className="body3 text-neutral-80"
													>
														{field.tablePermissions.scopeLabel}
													</Label>
													{field.tablePermissions.scopeDescription && (
														<span
															id={`${field.name}-${table.key}-scope-description`}
															className="body3 text-neutral-60"
														>
															{field.tablePermissions.scopeDescription}
														</span>
													)}
													<Select
														value={currentTable?.scope ?? "own"}
														onValueChange={(nextScope) =>
															updateField(
																field.name,
																setTablePermissionScope(
																	permissionValue,
																	table.key,
																	nextScope as PermissionScope,
																),
															)
														}
														disabled={
															field.disabled ||
															!(currentTable?.actions?.length ?? 0)
														}
													>
														<SelectTrigger
															id={`${field.name}-${table.key}-scope`}
															aria-describedby={
																field.tablePermissions.scopeDescription
																	? `${field.name}-${table.key}-scope-description`
																	: undefined
															}
															className="h-8 w-[140px]"
														>
															<SelectValue
																placeholder={field.tablePermissions?.scopeLabel}
															/>
														</SelectTrigger>
														<SelectContent>
															{field.tablePermissions.scopeOptions.map(
																(option) => (
																	<SelectItem
																		key={option.value}
																		value={option.value}
																	>
																		{option.label}
																	</SelectItem>
																),
															)}
														</SelectContent>
													</Select>
												</div>
											)}
										</>
									);
								})()}
							</div>
						))}
					</div>
				</div>
			)}

			{field.type === "fieldPermissions" && field.fieldPermissions && (
				<FieldPermissionsField
					field={field}
					fieldPermissions={field.fieldPermissions}
					value={value}
					updateField={updateField}
					isPrivate={isPrivate}
					resolvedPrivateDescription={resolvedPrivateDescription}
				/>
			)}

			{error && <p className="body3 text-destructive-secondary">{error}</p>}
			{field.afterField}
		</div>
	);
};

type BuildRenderFieldArgs = {
	tEnum: TFunction;
	tCommon: TFunction;
	selectPlaceholder: string;
	formData: Record<string, unknown>;
	errors: Record<string, string>;
	touched: Record<string, boolean>;
	config: FormWrapperConfig;
	updateField: (name: string, value: unknown) => void;
	handleFieldBlur: (
		field: FormWrapperFieldConfig,
		nextValue: unknown,
	) => void | Promise<void>;
	isPrivateField?: (field: FormWrapperFieldConfig) => boolean;
};

export const buildRenderField = ({
	tEnum,
	tCommon,
	selectPlaceholder,
	formData,
	errors,
	touched,
	config,
	updateField,
	handleFieldBlur,
	isPrivateField,
}: BuildRenderFieldArgs) => {
	const renderField = (
		field: FormWrapperFieldConfig,
		parentLayoutColumns = config.layout?.columns,
		isWithinAccordion = false,
	): React.ReactNode => {
		if (field.condition && !field.condition(formData)) {
			return null;
		}

		const isPrivate = isPrivateField?.(field) ?? false;

		if (field.type === "section") {
			const useAccordion = field.collapsible;
			const cardVariant =
				field.cardVariant ?? config.cardVariant ?? "secondary";
			const layoutColumns = field.layout?.columns ?? parentLayoutColumns;
			const gridClass = getResponsiveGridClass(layoutColumns);
			const spanClass = getSpanClass(field.layout, parentLayoutColumns);
			const accordionVariant = field.accordionVariant ?? "default";
			const accordionTitle =
				field.accordionTitle ?? field.title ?? field.description;
			const showTitleInBody = !useAccordion && Boolean(field.title);
			const showDescriptionInBody =
				Boolean(field.description) && (!useAccordion || Boolean(field.title));

			const sectionHeader =
				showTitleInBody || showDescriptionInBody ? (
					<div>
						{showTitleInBody && (
							<h3 className="text-lg font-semibold">{field.title}</h3>
						)}
						{showDescriptionInBody && (
							<p className="body2 text-neutral-80 mt-1">{field.description}</p>
						)}
					</div>
				) : null;

			const bodyContent = (
				<div className="space-y-4">
					{sectionHeader}
					<div className={cn("grid", field.fieldGap ?? "gap-4", gridClass)}>
						{field?.fields?.map((nestedField) =>
							renderField(
								nestedField,
								layoutColumns,
								isWithinAccordion || useAccordion,
							),
						)}
					</div>
				</div>
			);

			const accordionId = `${field.name}-section`;

			return (
				<ScrollReveal
					key={field.name}
					className={spanClass}
					disabled={isWithinAccordion}
				>
					<SectionWrapper
						wrapperId={field.name}
						wrapperClassName={field.className}
						useAccordion={useAccordion}
						accordionValue={accordionId}
						accordionDefaultOpen={field.defaultOpen}
						accordionVariant={accordionVariant}
						accordionTriggerClassName=""
						accordionTitle={accordionTitle}
						cardVariant={cardVariant}
						bodyContent={bodyContent}
					/>
				</ScrollReveal>
			);
		}

		if (!field.collapsible) {
			const gridClass = getGridClass(field);

			return (
				<ScrollReveal
					key={field.name}
					className={cn(gridClass, field.className)}
					disabled={isWithinAccordion}
				>
					{renderFieldContent(
						{
							field,
							tEnum,
							tCommon,
							selectPlaceholder,
							formData,
							errors,
							touched,
							config,
							updateField,
							handleFieldBlur,
							isPrivate,
						},
						false,
					)}
				</ScrollReveal>
			);
		}

		const accordionId = `${field.name}-accordion`;
		const accordionTitle =
			field.accordionTitle ?? field.labelNode ?? field.label;
		const accordionDescription = field.accordionDescription;
		const accordionVariant = field.accordionVariant ?? "default";

		const gridClass = getGridClass(field);

		return (
			<ScrollReveal
				key={field.name}
				className={cn(gridClass, field.className)}
				disabled={isWithinAccordion}
			>
				<Accordion
					type="single"
					collapsible
					defaultValue={field.defaultOpen ? accordionId : undefined}
					className="w-full"
				>
					<AccordionItem value={accordionId} variant={accordionVariant}>
						<AccordionTrigger className="body2" variant={accordionVariant}>
							{accordionTitle ?? <span className="sr-only">Field</span>}
						</AccordionTrigger>
						<AccordionContent variant={accordionVariant}>
							{accordionDescription && (
								<p className="body2 text-neutral-80 mb-2">
									{accordionDescription}
								</p>
							)}
							{renderFieldContent(
								{
									field,
									tEnum,
									tCommon,
									selectPlaceholder,
									formData,
									errors,
									touched,
									config,
									updateField,
									handleFieldBlur,
									isPrivate,
								},
								false,
							)}
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</ScrollReveal>
		);
	};

	return renderField;
};
