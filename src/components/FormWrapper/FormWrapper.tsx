"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TFunction } from "i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getResponsiveGridClass } from "@/components/shared/sectionLayout";
import type { FormWrapperFieldConfig, FormWrapperConfig } from "./types";
import { defaultFilterState } from "./constants";
import { buildRenderField } from "./renderField";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { normalizeFieldValue, validateFieldValue } from "./validation";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";

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
	const allFields = useMemo(() => getAllFields(config.fields), [config.fields]);
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
		const normalizedValue = normalizeFieldValue(
			field,
			nextValue,
			{ ...formData, [field.name]: nextValue },
			t,
			tEnum,
		);
		const nextFormData = { ...formData, [field.name]: normalizedValue };
		setTouched((prev) => ({ ...prev, [field.name]: true }));
		if (normalizedValue !== formData[field.name]) {
			setFormData(nextFormData);
		}
		try {
			if (field.onBlur) {
				await field.onBlur(normalizedValue, nextFormData, updateField);
			}
		} catch (error) {
			reportClientTelemetry({
				level: "warn",
				event: "form_wrapper.field_blur.failed",
				error,
				metadata: {
					field_name: field.name,
				},
			});
		}
		const fieldError = validateFieldValue(
			field,
			nextFormData[field.name],
			nextFormData,
			t,
			tEnum,
		);
		setErrors((prev) => {
			const nextErrors = { ...prev };
			if (fieldError) {
				nextErrors[field.name] = fieldError;
			} else {
				delete nextErrors[field.name];
			}
			if (Object.keys(nextErrors).length === 0) {
				setFormError(null);
			}
			return nextErrors;
		});
	};

	const validateForm = (): Record<string, string> => {
		const normalizedFormData = Object.fromEntries(
			allFields.map((field) => [
				field.name,
				normalizeFieldValue(field, formData[field.name], formData, t, tEnum),
			]),
		);
		const newErrors = collectValidationErrors(
			allFields,
			normalizedFormData,
			t,
			tEnum,
		);
		setFormData((prev) => ({ ...prev, ...normalizedFormData }));
		setErrors(newErrors);
		return newErrors;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		setTouched(buildTouchedMap(allFields));
		const validationErrors = validateForm();
		if (Object.keys(validationErrors).length === 0) {
			setFormError(null);
			const normalizedFormData = Object.fromEntries(
				allFields.map((field) => [
					field.name,
					normalizeFieldValue(field, formData[field.name], formData, t, tEnum),
				]),
			);
			setFormData((prev) => ({ ...prev, ...normalizedFormData }));
			try {
				await config.onSubmit({ ...formData, ...normalizedFormData });
			} catch (error) {
				setFormError(error instanceof Error ? error.message : t("alert.error"));
			}
		}
	};

	const renderField = buildRenderField({
		tEnum,
		tCommon: t,
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
