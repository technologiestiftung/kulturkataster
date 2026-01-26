"use client";

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
} from "./types";
import { AddressMapField } from "./AddressMapField";
import { defaultFilterState } from "./constants";

const getGridClass = (field: FormWrapperFieldConfig, gridColumns?: 1 | 2) =>
	field.layout?.span === "half" && gridColumns === 2
		? "col-span-1"
		: "col-span-2";

const togglePermissionValue = (
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
};

const renderFieldContent = (
	{
		field,
		formData,
		errors,
		touched,
		config,
		updateField,
		handleFieldBlur,
	}: RenderFieldContentArgs,
	includeLayout = true,
) => {
	const value = formData[field.name];
	const error = touched[field.name] ? errors[field.name] : undefined;

	const gridClass = getGridClass(field, config.layout?.columns);

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
					<Label htmlFor={field.name}>
						{field.labelNode ?? field.label}
						{field.required && <span className="ml-1">*</span>}
					</Label>
				)}

			{field.description &&
				field.type !== "tablePermissions" &&
				field.type !== "fieldPermissions" && (
					<p className="body2 text-neutral-80 mb-2">{field.description}</p>
				)}

			{(field.type === "text" ||
				field.type === "email" ||
				field.type === "password" ||
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
					value={value as string}
					onValueChange={(val) => updateField(field.name, val)}
					disabled={field.disabled}
				>
					<SelectTrigger id={field.name}>
						<SelectValue placeholder={field.placeholder || "Select..."} />
					</SelectTrigger>
					<SelectContent>
						{field.options?.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			{field.type === "radio" && (
				<RadioGroup
					value={value as string}
					onValueChange={(val) => updateField(field.name, val)}
					variant={field.radioVariant}
					disabled={field.disabled}
				>
					{field.options?.map((option) => (
						<div key={option.value} className="flex items-center space-x-2">
							<RadioGroupItem
								className="bg-background border-input"
								value={option.value}
								id={`${field.name}-${option.value}`}
							/>
							<Label
								htmlFor={`${field.name}-${option.value}`}
								className="font-normal"
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
					<Label htmlFor={field.name} className="font-normal">
						{field.labelNode ?? field.label}
						{field.required && <span className=" ml-1">*</span>}
					</Label>
				</div>
			)}

			{field.type === "switch" && (
				<div className="flex items-center justify-between">
					<Label htmlFor={field.name} className="font-normal">
						{field.labelNode ?? field.label}
						{field.required && <span className=" ml-1">*</span>}
					</Label>
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
									label: option.label,
									parentValue: option.parentValue,
								})),
							}))}
							sortOptions={field.multiselectSortOptions}
							disabled={field.disabled}
						/>
					) : (
						field.options?.map((option) => (
							<div key={option.value} className="flex items-center space-x-2">
								<Checkbox
									id={`${field.name}-${option.value}`}
									checked={(value as string[])?.includes(option.value)}
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

			{field.type === "actionPanel" && field.actionPanel && (
				<ActionPanel
					title={field.actionPanel.title}
					description={field.actionPanel.description}
					actionLabel={field.actionPanel.actionLabel}
					actionLabelLoading={field.actionPanel.actionLabelLoading}
					onAction={field.actionPanel.onAction}
					errorFallback={field.actionPanel.errorFallback}
					icon={field.actionPanel.icon}
					className={field.actionPanel.className}
				/>
			)}

			{field.type === "tablePermissions" && field.tablePermissions && (
				<div className="flex flex-col gap-1">
					<Label className="">{field.label}</Label>
					<div className="mt-4 grid gap-4">
						{field.tablePermissions.tables.map((table) => (
							<div
								key={table.key}
								className="rounded-sm border border-input bg-background p-4"
							>
								<p className="body3 ">{table.label}</p>
								<div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
									{(
										field.tablePermissions?.actions ?? [
											"read",
											"create",
											"update",
											"delete",
										]
									).map((action) => {
										const checkboxId = `${field.name}-${table.key}-${action}`;
										const permissionValue =
											(value as Record<string, PermissionAction[]>) ?? {};
										const isChecked =
											permissionValue[table.key]?.includes(action);
										return (
											<div key={action} className="flex items-center gap-2">
												<Checkbox
													id={checkboxId}
													checked={isChecked}
													onCheckedChange={() =>
														updateField(
															field.name,
															togglePermissionValue(
																permissionValue,
																table.key,
																action,
															),
														)
													}
													disabled={field.disabled}
												/>
												<Label htmlFor={checkboxId} className="capitalize">
													{field.tablePermissions?.actionLabels?.[action]}
												</Label>
											</div>
										);
									})}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{field.type === "fieldPermissions" && field.fieldPermissions && (
				<div className="flex flex-col gap-1">
					<Label className="">{field.label}</Label>
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
																						togglePermissionValue(
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
};

export const buildRenderField = ({
	formData,
	errors,
	touched,
	config,
	updateField,
	handleFieldBlur,
}: BuildRenderFieldArgs) => {
	const renderField = (field: FormWrapperFieldConfig): React.ReactNode => {
		if (field.condition && !field.condition(formData)) {
			return null;
		}

		if (field.type === "section") {
			const useAccordion = field.collapsible;
			const cardVariant =
				field.cardVariant ?? config.cardVariant ?? "secondary";
			const layoutColumns = field.layout?.columns ?? config.layout?.columns;
			const gridClass = getResponsiveGridClass(layoutColumns);
			const spanClass = getSpanClass(field.layout, layoutColumns);
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
						{field?.fields?.map((nestedField) => renderField(nestedField))}
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
				<div key={field.name} className="contents">
					{renderFieldContent({
						field,
						formData,
						errors,
						touched,
						config,
						updateField,
						handleFieldBlur,
					})}
				</div>
			);
		}

		const accordionId = `${field.name}-accordion`;
		const accordionTitle =
			field.accordionTitle ?? field.labelNode ?? field.label;
		const accordionDescription = field.accordionDescription;
		const accordionVariant = field.accordionVariant ?? "default";

		const gridClass = getGridClass(field, config.layout?.columns);

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
