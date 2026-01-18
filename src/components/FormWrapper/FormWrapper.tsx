"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { MultiSelectModal } from "@/components/MultiSelect/MultiSelectModal";
import { ActionPanel } from "@/components/ActionPanel";
import { cn } from "@/lib/utils";
import type { FieldConfig, FormWrapperConfig, PermissionAction } from "./types";

export function FormWrapper({ config }: { config: FormWrapperConfig }) {
	const [formData, setFormData] = useState<Record<string, unknown>>(() => {
		const initialData: Record<string, unknown> = {};

		const allFields = config.sections
			? config.sections.flatMap((s) => s.fields)
			: config.fields || [];

		allFields.forEach((field) => {
			if (field.type === "actionPanel") return;
			if (config.initialValues?.[field.name] !== undefined) {
				initialData[field.name] = config.initialValues[field.name];
			} else if (field.defaultValue !== undefined) {
				initialData[field.name] = field.defaultValue;
			} else if (field.type === "checkbox" || field.type === "switch") {
				initialData[field.name] = false;
			} else if (field.type === "multiselect") {
				initialData[field.name] = [];
			} else if (
				field.type === "tablePermissions" ||
				field.type === "fieldPermissions"
			) {
				initialData[field.name] = {};
			} else {
				initialData[field.name] = "";
			}
		});

		return initialData;
	});

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});

	const updateField = (name: string, value: unknown) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
		setTouched((prev) => ({ ...prev, [name]: true }));

		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const validateField = (
		field: FieldConfig,
		value: unknown,
	): string | undefined => {
		if (field.required) {
			if (value === undefined || value === null || value === "") {
				return `${field.label} is required`;
			}
			if (Array.isArray(value) && value.length === 0) {
				return `${field.label} is required`;
			}
		}

		if (field.validate) {
			return field.validate(value);
		}

		return undefined;
	};

	const validateForm = (): boolean => {
		const allFields = config.sections
			? config.sections.flatMap((s) => s.fields)
			: config.fields || [];

		const newErrors: Record<string, string> = {};

		allFields.forEach((field) => {
			if (field.condition && !field.condition(formData)) {
				return;
			}
			if (field.type === "actionPanel") {
				return;
			}

			const error = validateField(field, formData[field.name]);
			if (error) {
				newErrors[field.name] = error;
			}
		});

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const allFields = config.sections
			? config.sections.flatMap((s) => s.fields)
			: config.fields || [];
		const allTouched: Record<string, boolean> = {};
		allFields.forEach((field) => {
			if (field.type === "actionPanel") {
				return;
			}
			allTouched[field.name] = true;
		});
		setTouched(allTouched);

		if (validateForm()) {
			await config.onSubmit(formData);
		}
	};

	const renderField = (field: FieldConfig) => {
		if (field.condition && !field.condition(formData)) {
			return null;
		}

		const value = formData[field.name];
		const error = touched[field.name] ? errors[field.name] : undefined;

		const gridClass =
			field.gridColumn === "half" && config.gridColumns === 2
				? "col-span-1"
				: "col-span-2";

		const togglePermission = (
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

			updateField(field.name, nextValue);
		};

		return (
			<div key={field.name} className={cn("space-y-2", gridClass)}>
				{field.type !== "checkbox" &&
					field.type !== "switch" &&
					field.type !== "tablePermissions" &&
					field.type !== "fieldPermissions" && (
						<Label htmlFor={field.name}>
							{field.label}
							{field.required && (
								<span className="text-destructive ml-1">*</span>
							)}
						</Label>
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
						disabled={field.disabled}
					>
						{field.options?.map((option) => (
							<div key={option.value} className="flex items-center space-x-2">
								<RadioGroupItem
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
							{field.label}
							{field.required && (
								<span className="text-destructive ml-1">*</span>
							)}
						</Label>
					</div>
				)}

				{field.type === "switch" && (
					<div className="flex items-center justify-between">
						<Label htmlFor={field.name} className="font-normal">
							{field.label}
							{field.required && (
								<span className="text-destructive ml-1">*</span>
							)}
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
								title={field.label}
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
												: currentValue.filter(
														(v: string) => v !== option.value,
													);
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
									className="rounded-sm border border-input bg-white p-4"
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
															togglePermission(
																permissionValue,
																table.key,
																action,
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
									updateField(field.name, nextValue);
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
																						togglePermission(
																							permissionValue,
																							fieldItem.key,
																							action,
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

				{field.description &&
					field.type !== "tablePermissions" &&
					field.type !== "fieldPermissions" && (
						<p className="text-xs text-foreground">{field.description}</p>
					)}

				{error && <p className="text-xs text-destructive">{error}</p>}
			</div>
		);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{config.sections && (
				<>
					{config.sections.some((s) => s.useAccordion) ? (
						<>
							<Accordion
								type="multiple"
								defaultValue={config.sections
									.filter((s) => s.useAccordion && s.defaultOpen)
									.map((s) => s.id)}
								className="w-full"
							>
								{config.sections
									.filter((s) => s.useAccordion)
									.map((section) => (
										<AccordionItem key={section.id} value={section.id}>
											<AccordionTrigger className="text-lg font-semibold">
												{section.title}
											</AccordionTrigger>
											<AccordionContent>
												{section.description && (
													<p className="body3 text-foreground mb-4">
														{section.description}
													</p>
												)}
												<div
													className={cn(
														"grid gap-4",
														config.gridColumns === 2
															? "grid-cols-2"
															: "grid-cols-1",
													)}
												>
													{section.fields.map(renderField)}
												</div>
											</AccordionContent>
										</AccordionItem>
									))}
							</Accordion>

							{config.sections
								.filter((s) => !s.useAccordion)
								.map((section) => (
									<div key={section.id} className="space-y-4">
										<div>
											<h3 className="text-lg font-semibold">{section.title}</h3>
											{section.description && (
												<p className="body3 text-foreground mt-1">
													{section.description}
												</p>
											)}
										</div>
										<div
											className={cn(
												"grid gap-4",
												config.gridColumns === 2
													? "grid-cols-2"
													: "grid-cols-1",
											)}
										>
											{section.fields.map(renderField)}
										</div>
									</div>
								))}
						</>
					) : (
						<div className="space-y-8">
							{config.sections.map((section) => (
								<div key={section.id} className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold">{section.title}</h3>
										{section.description && (
											<p className="body3 text-foreground mt-1">
												{section.description}
											</p>
										)}
									</div>
									<div
										className={cn(
											"grid gap-4",
											config.gridColumns === 2 ? "grid-cols-2" : "grid-cols-1",
										)}
									>
										{section.fields.map(renderField)}
									</div>
								</div>
							))}
						</div>
					)}
				</>
			)}

			{config.fields && (
				<div
					className={cn(
						"grid gap-4",
						config.gridColumns === 2 ? "grid-cols-2" : "grid-cols-1",
					)}
				>
					{config.fields.map(renderField)}
				</div>
			)}

			{!config.hideActions && (
				<div className="flex items-center justify-end gap-4">
					{config.showCancel && (
						<Button type="button" variant="outline" onClick={config.onCancel}>
							{config.cancelLabel || "Cancel"}
						</Button>
					)}
					<Button type="submit">{config.submitLabel || "Submit"}</Button>
				</div>
			)}
		</form>
	);
}
