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
import { cn } from "@/lib/utils";
import type { FormWrapperConfig, FieldConfig } from "./types";

export function FormWrapper({ config }: { config: FormWrapperConfig }) {
	const [formData, setFormData] = useState<Record<string, unknown>>(() => {
		const initialData: Record<string, unknown> = {};

		// Initialize with default values
		const allFields = config.sections
			? config.sections.flatMap((s) => s.fields)
			: config.fields || [];

		allFields.forEach((field) => {
			if (config.initialValues?.[field.name] !== undefined) {
				initialData[field.name] = config.initialValues[field.name];
			} else if (field.defaultValue !== undefined) {
				initialData[field.name] = field.defaultValue;
			} else if (field.type === "checkbox" || field.type === "switch") {
				initialData[field.name] = false;
			} else if (field.type === "multiselect") {
				initialData[field.name] = [];
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

		// Clear error when user starts typing
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
		// Required validation
		if (field.required) {
			if (value === undefined || value === null || value === "") {
				return `${field.label} is required`;
			}
			if (Array.isArray(value) && value.length === 0) {
				return `${field.label} is required`;
			}
		}

		// Custom validation
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

		// Mark all fields as touched
		const allFields = config.sections
			? config.sections.flatMap((s) => s.fields)
			: config.fields || [];
		const allTouched: Record<string, boolean> = {};
		allFields.forEach((field) => {
			allTouched[field.name] = true;
		});
		setTouched(allTouched);

		if (validateForm()) {
			await config.onSubmit(formData);
		}
	};

	const renderField = (field: FieldConfig) => {
		// Check condition
		if (field.condition && !field.condition(formData)) {
			return null;
		}

		const value = formData[field.name];
		const error = touched[field.name] ? errors[field.name] : undefined;

		const gridClass =
			field.gridColumn === "half" && config.gridColumns === 2
				? "col-span-1"
				: "col-span-2";

		return (
			<div key={field.name} className={cn("space-y-2", gridClass)}>
				{field.type !== "checkbox" && field.type !== "switch" && (
					<Label htmlFor={field.name}>
						{field.label}
						{field.required && <span className="text-destructive ml-1">*</span>}
					</Label>
				)}

				{/* Text-based inputs */}
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

				{/* Textarea */}
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

				{/* Select */}
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

				{/* Radio Group */}
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

				{/* Checkbox */}
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

				{/* Switch */}
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

				{/* Multi-select (checkboxes) */}
				{field.type === "multiselect" && (
					<div className="space-y-2">
						{field.options?.map((option) => (
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
						))}
					</div>
				)}

				{/* Description */}
				{field.description && (
					<p className="text-xs text-muted-foreground">{field.description}</p>
				)}

				{/* Error message */}
				{error && <p className="text-xs text-destructive">{error}</p>}
			</div>
		);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Sections */}
			{config.sections && (
				<>
					{/* Check if any section uses accordion */}
					{config.sections.some((s) => s.useAccordion) ? (
						<>
							{/* Render accordion sections */}
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
													<p className="text-sm text-muted-foreground mb-4">
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

							{/* Render non-accordion sections */}
							{config.sections
								.filter((s) => !s.useAccordion)
								.map((section) => (
									<div key={section.id} className="space-y-4">
										<div>
											<h3 className="text-lg font-semibold">{section.title}</h3>
											{section.description && (
												<p className="text-sm text-muted-foreground mt-1">
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
						/* All sections without accordion */
						<div className="space-y-8">
							{config.sections.map((section) => (
								<div key={section.id} className="space-y-4">
									<div>
										<h3 className="text-lg font-semibold">{section.title}</h3>
										{section.description && (
											<p className="text-sm text-muted-foreground mt-1">
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

			{/* Flat fields */}
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

			{/* Form actions */}
			{!config.hideActions && (
				<div className="flex items-center justify-end gap-4">
					{config.showCancel && (
						<Button type="button" variant="ghost" onClick={config.onCancel}>
							{config.cancelLabel || "Cancel"}
						</Button>
					)}
					<Button type="submit">{config.submitLabel || "Submit"}</Button>
				</div>
			)}
		</form>
	);
}
