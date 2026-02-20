"use client";

import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { buildStreetLine, toOptionalNumber } from "@/lib/utils/formUtils";
import type { FilterState } from "@/types";
import type {
	FormWrapperFieldConfig,
	FormWrapperConfig,
	PermissionAction,
	PermissionScope,
	TablePermissionValue,
} from "./types";
import { AddressMapField } from "./AddressMapField";
import { FundingSourceField } from "./FundingSourceField";
import { defaultFilterState } from "./constants";
import Eye from "@/icons/eye.svg";
import EyeOff from "@/icons/eye-off.svg";
import { PrivateBadge } from "@/components/shared/PrivateBadge";

function PasswordField({
	id,
	value,
	onChange,
	onBlur,
	placeholder,
	disabled,
}: {
	id: string;
	value: string;
	onChange: (value: string) => void;
	onBlur: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
}) {
	const [showPassword, setShowPassword] = useState(false);
	const { t } = useTranslation("common");

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
				className="pr-12"
			/>
			<button
				type="button"
				className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-80 hover:text-neutral-100"
				aria-label={
					showPassword ? t("auth.password.hide") : t("auth.password.show")
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
		</div>
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

const toggleFieldPermissionValue = (
	currentValue: Record<string, PermissionAction[]>,
	key: string,
	action: PermissionAction,
) => {
	const currentActions = new Set(currentValue[key] ?? []);
	if (currentActions.has(action)) {
		currentActions.delete(action);
	} else {
		currentActions.add(action);
	}

	const nextValue = { ...currentValue };
	if (currentActions.size === 0) {
		delete nextValue[key];
	} else {
		nextValue[key] = Array.from(currentActions);
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

const toggleSectionPermissionValue = (
	permissionValue: Record<string, PermissionAction[]>,
	sectionKeys: string[],
	action: PermissionAction,
) => {
	const nextValue = { ...permissionValue };
	const isAllChecked = sectionKeys.every((key) =>
		(nextValue[key] ?? []).includes(action),
	);

	sectionKeys.forEach((key) => {
		const current = new Set(nextValue[key] ?? []);
		if (isAllChecked) {
			current.delete(action);
		} else {
			current.add(action);
		}
		if (current.size === 0) {
			delete nextValue[key];
		} else {
			nextValue[key] = Array.from(current);
		}
	});

	return nextValue;
};

const serializeOptionValue = (value: string | number | boolean): string =>
	`${typeof value}:${String(value)}`;

const deserializeOptionValue = (value: string): string | number | boolean => {
	const separatorIndex = value.indexOf(":");
	if (separatorIndex < 0) return value;
	const type = value.slice(0, separatorIndex);
	const rawValue = value.slice(separatorIndex + 1);
	if (type === "boolean") {
		return rawValue === "true";
	}
	if (type === "number") {
		const parsed = Number(rawValue);
		return Number.isFinite(parsed) ? parsed : rawValue;
	}
	return rawValue;
};

const getSerializedSelectedValue = (
	options: Array<{ value: string | number | boolean }> | undefined,
	currentValue: unknown,
): string | undefined => {
	if (currentValue === undefined || currentValue === null) return undefined;
	if (!options || options.length === 0) return String(currentValue);

	const matchingOption = options.find(
		(option) => option.value === currentValue,
	);
	if (matchingOption) return serializeOptionValue(matchingOption.value);

	return undefined;
};

type RenderFieldContentArgs = {
	field: FormWrapperFieldConfig;
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

	const gridClass = getGridClass(field);

	return (
		<div
			className={cn(
				"space-y-1",
				includeLayout && gridClass,
				includeLayout && field.className,
			)}
		>
			{(field.label || field.labelNode) &&
				field.type !== "checkbox" &&
				field.type !== "switch" &&
				field.type !== "tablePermissions" &&
				field.type !== "fieldPermissions" && (
					<div className="flex items-center justify-between gap-2">
						<Label htmlFor={field.name} className="text-neutral-80">
							{field.labelNode ?? field.label}
							{field.required && <span className="ml-1">*</span>}
						</Label>
						{isPrivate ? <PrivateBadge /> : null}
					</div>
				)}

			{field.description &&
				field.type !== "tablePermissions" &&
				field.type !== "fieldPermissions" && (
					<p className="body2 text-neutral-80 mb-2">{field.description}</p>
				)}

			{(field.type === "text" ||
				field.type === "email" ||
				field.type === "number" ||
				field.type === "tel" ||
				field.type === "url" ||
				field.type === "date") && (
				<Input
					id={field.name}
					type={field.type}
					value={value as string}
					onChange={(e) => updateField(field.name, e.target.value)}
					onBlur={(e) => {
						void handleFieldBlur(field, e.target.value);
					}}
					placeholder={field.placeholder}
					disabled={field.disabled}
					min={field.min}
					max={field.max}
					step={field.step}
				/>
			)}

			{field.type === "password" && (
				<PasswordField
					id={field.name}
					value={(value as string) ?? ""}
					onChange={(val) => updateField(field.name, val)}
					onBlur={(val) => {
						void handleFieldBlur(field, val);
					}}
					placeholder={field.placeholder}
					disabled={field.disabled}
				/>
			)}

			{field.type === "textarea" && (
				<Textarea
					id={field.name}
					value={value as string}
					onChange={(e) => updateField(field.name, e.target.value)}
					onBlur={(e) => {
						void handleFieldBlur(field, e.target.value);
					}}
					placeholder={field.placeholder}
					disabled={field.disabled}
					rows={4}
				/>
			)}

			{field.type === "select" && (
				<Select
					value={getSerializedSelectedValue(field.options, value)}
					onValueChange={(val) =>
						updateField(field.name, deserializeOptionValue(val))
					}
					disabled={field.disabled}
				>
					<SelectTrigger id={field.name}>
						<SelectValue placeholder={field.placeholder || "Select..."} />
					</SelectTrigger>
					<SelectContent className="px-3">
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
			)}

			{field.type === "radio" && (
				<RadioGroup
					value={getSerializedSelectedValue(field.options, value)}
					onValueChange={(val) =>
						updateField(field.name, deserializeOptionValue(val))
					}
					variant={field.radioVariant}
					disabled={field.disabled}
				>
					{field.options?.map((option) => (
						<div
							key={serializeOptionValue(option.value)}
							className="flex items-center space-x-2"
						>
							<RadioGroupItem
								className="bg-background border-input"
								value={serializeOptionValue(option.value)}
								id={`${field.name}-${serializeOptionValue(option.value)}`}
							/>
							<Label
								htmlFor={`${field.name}-${serializeOptionValue(option.value)}`}
								emphasize={false}
							>
								{option.label}
							</Label>
						</div>
					))}
				</RadioGroup>
			)}

			{field.type === "checkbox" && (
				<div className="flex items-center space-x-2">
					<Checkbox
						id={field.name}
						checked={value as boolean}
						onCheckedChange={(checked) => updateField(field.name, checked)}
						disabled={field.disabled}
					/>
					<Label htmlFor={field.name} emphasize={false}>
						{field.labelNode ?? field.label}
						{field.required && <span className=" ml-1">*</span>}
					</Label>
					{isPrivate ? <PrivateBadge /> : null}
				</div>
			)}

			{field.type === "switch" && (
				<div className="flex items-center justify-between">
					<Label htmlFor={field.name} className="font-normal">
						{field.labelNode ?? field.label}
						{field.required && <span className=" ml-1">*</span>}
					</Label>
					{isPrivate ? <PrivateBadge /> : null}
					<Switch
						id={field.name}
						checked={value as boolean}
						onCheckedChange={(checked) => updateField(field.name, checked)}
						disabled={field.disabled}
					/>
				</div>
			)}

			{field.type === "multiselect" && (
				<div className="space-y-2">
					{field.multiselectVariant === "modal" ? (
						<MultiSelectModal
							title={field.label || "Select Items"}
							options={field.options ?? []}
							filteredOptions={field.multiselectFilteredOptions}
							selected={(value as string[]) ?? []}
							onChange={(selected) => updateField(field.name, selected)}
							placeholder={field.placeholder}
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
						field.options?.map((option) => (
							<div
								key={option.value as string}
								className="flex items-center space-x-2"
							>
								<Checkbox
									id={`${field.name}-${option.value}`}
									checked={
										(value as string[])?.includes(option.value as string) ??
										false
									}
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
							</div>
						))
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

			{field.type === "actionPanel" && field.actionPanel && (
				<ActionPanel
					title={field.actionPanel.title}
					actionLabel={field.actionPanel.actionLabel}
					actionLabelLoading={field.actionPanel.actionLabelLoading}
					onAction={field.actionPanel.onAction}
					errorFallback={field.actionPanel.errorFallback}
					icon={field.actionPanel.icon}
					className={field.actionPanel.className}
				>
					{field.actionPanel.description}
				</ActionPanel>
			)}

			{field.type === "tablePermissions" && field.tablePermissions && (
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between gap-2">
						<Label className="">{field.label}</Label>
						{isPrivate ? <PrivateBadge /> : null}
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
									const actions = field.tablePermissions?.actions ?? [
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
				<div className="flex flex-col gap-1">
					<div className="flex items-center justify-between gap-2">
						<Label className="">{field.label}</Label>
						{isPrivate ? <PrivateBadge /> : null}
					</div>
					<div className="mt-4 grid gap-4">
						{field.fieldPermissions.sections.map((section) => {
							const permissionValue =
								(value as Record<string, PermissionAction[]>) ?? {};
							const actions = field.fieldPermissions?.actions ?? [
								"read",
								"create",
								"update",
								"delete",
							];
							const sectionKeys = section.fields.map((item) => item.key);

							const toggleSectionAction = (action: PermissionAction) => {
								if (field.disabled) return;
								updateField(
									field.name,
									toggleSectionPermissionValue(
										permissionValue,
										sectionKeys,
										action,
									),
								);
							};

							return (
								<div key={section.id} className="w-full overflow-x-auto">
									<div className="overflow-x-auto rounded-md border border-input bg-background">
										<table className="border-collapse w-full">
											<thead className="bg-neutral-5 text-foreground">
												<tr className="text-left">
													<th className="border-b border-input px-3 py-2">
														{field.fieldPermissions?.fieldLabel ?? "Field"}
													</th>
													{actions.map((action) => (
														<th
															key={action}
															className="border-b border-input px-3 py-2 capitalize text-center cursor-pointer"
															onClick={() => toggleSectionAction(action)}
														>
															{field.fieldPermissions?.actionLabels?.[action]}
														</th>
													))}
												</tr>
											</thead>
											<tbody className="[&>tr:last-child>td]:border-b-0 [&>tr:nth-child(even)]:bg-neutral-5/60">
												{section.fields.map((fieldItem) => {
													return (
														<tr key={fieldItem.key} className="border-input">
															<td className="border-b border-input px-3 py-2 text-neutral-80">
																{fieldItem.label}
															</td>
															{actions.map((action) => {
																const checkboxId = `${field.name}-${section.id}-${fieldItem.key}-${action}`;
																const isChecked =
																	permissionValue[fieldItem.key]?.includes(
																		action,
																	) ?? false;
																return (
																	<td
																		key={action}
																		className="border-b border-input px-3 py-2 text-center"
																	>
																		<div className="flex items-center justify-center">
																			<Checkbox
																				id={checkboxId}
																				checked={isChecked}
																				onCheckedChange={() =>
																					updateField(
																						field.name,
																						toggleFieldPermissionValue(
																							permissionValue,
																							fieldItem.key,
																							action,
																						),
																					)
																				}
																				disabled={field.disabled}
																			/>
																		</div>
																	</td>
																);
															})}
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{field.afterField}
			{error && <p className="body3 text-destructive">{error}</p>}
		</div>
	);
};

type BuildRenderFieldArgs = {
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
							renderField(nestedField, layoutColumns),
						)}
					</div>
				</div>
			);

			const accordionId = `${field.name}-section`;

			return (
				<SectionWrapper
					key={field.name}
					wrapperId={field.name}
					wrapperClassName={field.className}
					spanClassName={spanClass}
					useAccordion={useAccordion}
					accordionValue={accordionId}
					accordionDefaultOpen={field.defaultOpen}
					accordionVariant={accordionVariant}
					accordionTriggerClassName=""
					accordionTitle={accordionTitle}
					cardVariant={cardVariant}
					bodyContent={bodyContent}
				/>
			);
		}

		if (!field.collapsible) {
			return (
				<Fragment key={field.name}>
					{renderFieldContent({
						field,
						formData,
						errors,
						touched,
						config,
						updateField,
						handleFieldBlur,
						isPrivate,
					})}
				</Fragment>
			);
		}

		const accordionId = `${field.name}-accordion`;
		const accordionTitle =
			field.accordionTitle ?? field.labelNode ?? field.label;
		const accordionDescription = field.accordionDescription;
		const accordionVariant = field.accordionVariant ?? "default";

		const gridClass = getGridClass(field);

		return (
			<div key={field.name} className={cn(gridClass, field.className)}>
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
			</div>
		);
	};

	return renderField;
};
