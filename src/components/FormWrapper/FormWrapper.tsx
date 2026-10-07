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
import { getAccessibleScrollBehavior } from "@/lib/utils/motion";

const getAllFields = (
	fields: FormWrapperFieldConfig[],
): FormWrapperFieldConfig[] => {
	const result: FormWrapperFieldConfig[] = [];

	fields?.forEach((field) => {
		if (field.type === "section") {
			if (!field.fields) return;
			result.push(...getAllFields(field.fields));
		} else if (field.type !== "actionPanel" && field.type !== "custom") {
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
		} else if (field.type === "radio" && field.allowNullOption) {
			initialData[field.name] = null;
		} else if (field.type === "multiselect") {
			initialData[field.name] = [];
		} else if (field.type === "likertMatrix") {
			initialData[field.name] = {};
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

		if (
			(field.type === "radio" || field.type === "multiselect") &&
			field.freeTextOption
		) {
			const freeTextFieldName =
				field.freeTextOption.fieldName ?? `${field.name}FreeText`;
			initialData[freeTextFieldName] =
				config.initialValues?.[freeTextFieldName] ?? "";
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
		if (field.type === "actionPanel" || field.type === "custom") {
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
		if (field.type === "actionPanel" || field.type === "custom") {
			return;
		}
		allTouched[field.name] = true;
	});
	return allTouched;
};

export function FormWrapper({ config }: { config: FormWrapperConfig }) {
	const { t } = useTranslation();
	const { t: tEnum } = useTranslation();
	const onChangeRef = useRef<FormWrapperConfig["onChange"]>(config.onChange);
	const fieldVersionsRef = useRef<Record<string, number>>({});
	const isSubmittingRef = useRef(false);
	const allFields = useMemo(() => getAllFields(config.fields), [config.fields]);
	const [formData, setFormData] = useState<Record<string, unknown>>(() =>
		buildInitialFormData(config),
	);

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [formError, setFormError] = useState<string | null>(null);
	// After a failed submit attempt, errors follow the data live (see effect
	// below), so a half-answered field and newly shown required fields keep
	// their errors instead of being cleared on the next change.
	const [hasSubmitAttempt, setHasSubmitAttempt] = useState(false);

	const bumpFieldVersion = (name: string) => {
		fieldVersionsRef.current[name] = (fieldVersionsRef.current[name] ?? 0) + 1;
	};

	const updateField = (name: string, value: unknown) => {
		bumpFieldVersion(name);
		setFormData((prev) => ({ ...prev, [name]: value }));
		setTouched((prev) => ({ ...prev, [name]: true }));
		if (!hasSubmitAttempt && errors[name]) {
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
			bumpFieldVersion(field.name);
			setFormData(nextFormData);
		}
		const blurFieldVersions = { ...fieldVersionsRef.current };
		const updateFieldIfUnchanged = (name: string, value: unknown) => {
			if (
				(fieldVersionsRef.current[name] ?? 0) !== (blurFieldVersions[name] ?? 0)
			) {
				return;
			}
			updateField(name, value);
		};
		try {
			if (field.onBlur) {
				await field.onBlur(
					normalizedValue,
					nextFormData,
					updateFieldIfUnchanged,
				);
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

	const normalizeFormData = (data: Record<string, unknown>) =>
		Object.fromEntries(
			allFields.map((field) => [
				field.name,
				normalizeFieldValue(field, data[field.name], data, t, tEnum),
			]),
		);

	const validateForm = (): Record<string, string> => {
		const normalizedFormData = normalizeFormData(formData);
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
		if (isSubmittingRef.current) return;

		setTouched(buildTouchedMap(allFields));
		const validationErrors = validateForm();
		setHasSubmitAttempt(Object.keys(validationErrors).length > 0);
		if (Object.keys(validationErrors).length > 0) {
			const firstErrorName = allFields.find(
				(field) => validationErrors[field.name],
			)?.name;
			const firstErrorElement = firstErrorName
				? document.getElementById(firstErrorName)
				: null;
			firstErrorElement?.scrollIntoView?.({
				behavior: getAccessibleScrollBehavior(),
				block: "center",
			});
		}
		if (Object.keys(validationErrors).length === 0) {
			setFormError(null);
			const normalizedFormData = Object.fromEntries(
				allFields.map((field) => [
					field.name,
					normalizeFieldValue(field, formData[field.name], formData, t, tEnum),
				]),
			);
			setFormData((prev) => ({ ...prev, ...normalizedFormData }));
			isSubmittingRef.current = true;
			try {
				await config.onSubmit({ ...formData, ...normalizedFormData });
			} catch (error) {
				setFormError(
					error instanceof Error ? error.message : t("common.alert.error"),
				);
			} finally {
				isSubmittingRef.current = false;
			}
		}
	};

	const renderField = buildRenderField({
		tEnum,
		tCommon: t,
		selectPlaceholder: t("common.select"),
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

	useEffect(() => {
		if (!hasSubmitAttempt) return;
		const liveErrors = collectValidationErrors(
			allFields,
			normalizeFormData(formData),
			t,
			tEnum,
		);
		setErrors(liveErrors);
		if (Object.keys(liveErrors).length === 0) {
			setFormError(null);
		}
		// Only data changes re-validate: callers like the questionnaire rebuild
		// their field config on every render, which would otherwise loop.
	}, [formData, hasSubmitAttempt]);

	return (
		<form id={config.formId} onSubmit={handleSubmit} noValidate>
			<div className="flex flex-col gap-6 max-w-3xl mx-auto">
				<div
					className={cn(
						"grid gap-8",
						getResponsiveGridClass(config.layout?.columns),
						config.className,
					)}
				>
					{config.fields?.map((field) => renderField(field))}
				</div>
				{!config.hideActions && (
					<div className="flex flex-col pb-24 md:pb-0">
						<AlertDialog
							title={t("common.error")}
							status="error"
							description={formError ?? ""}
							open={Boolean(formError)}
							onOpenChange={(open) => {
								if (!open) {
									setFormError(null);
								}
							}}
							confirmLabel={t("common.close")}
							onConfirm={() => setFormError(null)}
						/>

						<div className="flex flex-1 flex-col-reverse items-center w-full justify-center md:justify-end gap-4 mt-4 flex-col md:flex-row">
							{config.showCancel && (
								<Button
									type="button"
									variant="outline"
									fullWidth
									onClick={config.onCancel}
								>
									{config.cancelLabel || t("common.cancel")}
								</Button>
							)}
							<Button type="submit" disabled={config.submitDisabled} fullWidth>
								{config.submitLabel || t("common.submit")}
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
