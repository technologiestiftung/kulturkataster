"use client";

import { useEffect, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getResponsiveGridClass } from "@/components/shared/sectionLayout";
import type { FormWrapperFieldConfig, FormWrapperConfig } from "./types";
import { defaultFilterState } from "./constants";
import { buildRenderField } from "./renderField";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { getFieldError, getFieldLabel } from "@/lib/i18n/fieldLabels";

const getAllFields = (
	fields: FormWrapperFieldConfig[],
): FormWrapperFieldConfig[] => {
	const result: FormWrapperFieldConfig[] = [];

	fields?.forEach((field) => {
		if (field.type === "section") {
			if (!field.fields) return;
			result.push(...getAllFields(field.fields));
		} else if (field.type !== "actionPanel") {
			result.push(field);
		}
	});

	return result;
};

const buildInitialFormData = (config: FormWrapperConfig) => {
	const initialData: Record<string, unknown> = {};
	const allFields = [
		...getAllFields(config.fields),
		...getAllFields(config.footerFields ?? []),
	];

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
		} else if (field.type === "file") {
			initialData[field.name] = null;
		} else if (field.type === "fundingSources") {
			initialData[field.name] = [];
		} else if (field.type === "filterPanel") {
			initialData[field.name] = { ...defaultFilterState };
		} else if (
			field.type === "tablePermissions" ||
			field.type === "fieldPermissions"
		) {
			initialData[field.name] = {};
		} else if (field.type === "addressMap" && field.addressMap) {
			const latKey = field.addressMap.latField;
			const lngKey = field.addressMap.lngField;
			if (config.initialValues?.[latKey] !== undefined) {
				initialData[latKey] = config.initialValues[latKey];
			} else {
				initialData[latKey] = null;
			}
			if (config.initialValues?.[lngKey] !== undefined) {
				initialData[lngKey] = config.initialValues[lngKey];
			} else {
				initialData[lngKey] = null;
			}
		} else {
			initialData[field.name] = "";
		}
	});

	return initialData;
};

const validateFieldValue = (
	field: FormWrapperFieldConfig,
	value: unknown,
	nextFormData: Record<string, unknown>,
	t: (key: string, options?: Record<string, unknown>) => string,
	tEnum: TFunction,
): string | undefined => {
	const fieldMetaKey =
		field.type === "section" ? field.name : (field.fieldMetaKey ?? field.name);
	const fieldLabel =
		field.type === "section"
			? (field.label ?? getFieldLabel(tEnum, fieldMetaKey))
			: (field.label ?? getFieldLabel(tEnum, fieldMetaKey));
	const requiredDefault = t("form.validation.required", {
		field: fieldLabel,
	});
	const requiredMessageRaw =
		field.requiredMessage ??
		(field.type !== "section" ? field.errorMessages?.required : undefined) ??
		getFieldError(tEnum, fieldMetaKey, "required");
	const requiredMessage =
		requiredMessageRaw === `field_names.${fieldMetaKey}.errors.required`
			? requiredDefault
			: requiredMessageRaw;

	if (field.required) {
		if (field.type === "checkbox" && value !== true) {
			return requiredMessage;
		}
		if (value === undefined || value === null || value === "") {
			return requiredMessage;
		}
		if (Array.isArray(value) && value.length === 0) {
			return requiredMessage;
		}
	}

	if (field.validate) {
		return field.validate(value);
	}

	if (field.validateWithForm) {
		return field.validateWithForm(value, nextFormData);
	}

	return undefined;
};

const collectValidationErrors = (
	fields: FormWrapperFieldConfig[],
	formData: Record<string, unknown>,
	t: (key: string, options?: Record<string, unknown>) => string,
	tEnum: TFunction,
) => {
	const newErrors: Record<string, string> = {};

	fields.forEach((field) => {
		if (field.condition && !field.condition(formData)) {
			return;
		}
		if (field.type === "actionPanel") {
			return;
		}

		const error = validateFieldValue(
			field,
			formData[field.name],
			formData,
			t,
			tEnum,
		);
		if (error) {
			newErrors[field.name] = error;
		}
	});

	return newErrors;
};

const buildTouchedMap = (fields: FormWrapperFieldConfig[]) => {
	const allTouched: Record<string, boolean> = {};
	fields.forEach((field) => {
		if (field.type === "actionPanel") {
			return;
		}
		allTouched[field.name] = true;
	});
	return allTouched;
};

export function FormWrapper({ config }: { config: FormWrapperConfig }) {
	const { t } = useTranslation("common");
	const { t: tEnum } = useTranslation("enumMap");
	const onChangeRef = useRef<FormWrapperConfig["onChange"]>(config.onChange);
	const [formData, setFormData] = useState<Record<string, unknown>>(() =>
		buildInitialFormData(config),
	);

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [formError, setFormError] = useState<string | null>(null);

	const updateField = (name: string, value: unknown) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
		setTouched((prev) => ({ ...prev, [name]: true }));
		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name];
				if (Object.keys(newErrors).length === 0) {
					setFormError(null);
				}
				return newErrors;
			});
		}
	};

	const handleFieldBlur = async (
		field: FormWrapperFieldConfig,
		nextValue: unknown,
	) => {
		if (!field.onBlur) return;
		const nextFormData = { ...formData, [field.name]: nextValue };
		try {
			await field.onBlur(nextValue, nextFormData, updateField);
		} catch (error) {
			console.warn(`Field onBlur failed for ${field.name}`, error);
		}
	};

	const validateForm = (): boolean => {
		const allFields = getAllFields(config.fields);
		const newErrors = collectValidationErrors(allFields, formData, t, tEnum);
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const allFields = getAllFields(config.fields);
		setTouched(buildTouchedMap(allFields));
		if (validateForm()) {
			setFormError(null);
			await config.onSubmit(formData);
		} else {
			setFormError(t("alert.errorFixFields"));
		}
	};

	const renderField = buildRenderField({
		tEnum,
		formData,
		errors,
		touched,
		config,
		updateField,
		handleFieldBlur,
		isPrivateField: config.isPrivateField,
	});

	useEffect(() => {
		onChangeRef.current = config.onChange;
	}, [config.onChange]);

	useEffect(() => {
		onChangeRef.current?.(formData);
	}, [formData]);

	return (
		<form id={config.formId} onSubmit={handleSubmit} noValidate>
			<div className="flex flex-col gap-6 max-w-3xl mx-auto">
				<div
					className={cn(
						"grid gap-4",
						getResponsiveGridClass(config.layout?.columns),
						config.className,
					)}
				>
					{config.fields?.map((field) => renderField(field))}
				</div>
				{!config.hideActions && (
					<div className="flex flex-col">
						<AlertDialog
							title={t("error")}
							status="error"
							description={formError ?? ""}
							open={Boolean(formError)}
							onOpenChange={(open) => {
								if (!open) {
									setFormError(null);
								}
							}}
							confirmLabel={t("close")}
							onConfirm={() => setFormError(null)}
						/>
						<div className="flex items-center justify-end gap-4 mt-4">
							{config.showCancel && (
								<Button
									type="button"
									variant="outline"
									onClick={config.onCancel}
								>
									{config.cancelLabel || "Cancel"}
								</Button>
							)}
							<Button type="submit" disabled={config.submitDisabled}>
								{config.submitLabel || "Submit"}
							</Button>
						</div>
						{config.deleteAction && (
							<Button
								type="button"
								variant="tertiary"
								className={cn(
									"self-start mt-3 underline",
									config.deleteAction.className,
								)}
								onClick={config.deleteAction.onClick}
								disabled={config.deleteAction.disabled}
							>
								{config.deleteAction.label}
							</Button>
						)}
					</div>
				)}
				{config.footerFields && config.footerFields.length > 0 && (
					<div
						className={cn(
							"grid gap-4",
							getResponsiveGridClass(config.layout?.columns),
						)}
					>
						{config.footerFields.map((field) => renderField(field))}
					</div>
				)}
			</div>
		</form>
	);
}
