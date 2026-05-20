"use client";

import { useState } from "react";
import Link from "next/link";
import { registerWithEmailPassword } from "@/server/actions/auth";
import { useTranslation } from "react-i18next";
import {
	email as emailValidator,
	FormWrapper,
	matchesField,
	minLength,
} from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { NewsletterSubscriptionStatus } from "@/types/newsletter";

export function RegisterForm({
	onSuccess,
}: {
	onSuccess?: (subscribedToNewsletter: NewsletterSubscriptionStatus) => void;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const toLocalePath = useLocalePath();
	const { t } = useTranslation("common");

	const handleSubmit = async (data: Record<string, unknown>) => {
		const email = String(data.email ?? "");
		const password = String(data.password ?? "");
		const firstName = String(data.firstName ?? "");
		const lastName = String(data.lastName ?? "");
		const accountType = String(data.accountType ?? "");

		const organizationName = String(data.organizationName ?? "");
		const organizationPosition = String(data.organizationPosition ?? "");
		const organizationPhone = String(data.organizationPhone ?? "");
		const districtName = String(data.districtName ?? "");
		const districtOffice = String(data.districtOffice ?? "");
		const districtPosition = String(data.districtPosition ?? "");
		const districtPhone = String(data.districtPhone ?? "");
		const administrationName = String(data.administrationName ?? "");
		const administrationPosition = String(data.administrationPosition ?? "");
		const administrationPhone = String(data.administrationPhone ?? "");
		const subscribeToNewsletter = Boolean(data.subscribeNewsletter);
		let subscribedToNewsletter: NewsletterSubscriptionStatus = null;

		setIsLoading(true);
		setErrorMessage(null);

		try {
			const result = await registerWithEmailPassword({
				email,
				password,
				firstName,
				lastName,
				accountType,
				organizationName,
				organizationPosition,
				organizationPhone,
				districtName,
				districtOffice,
				districtPosition,
				districtPhone,
				administrationName,
				administrationPosition,
				administrationPhone,
			});
			if (!result.ok) {
				setErrorMessage(t("auth.register.unavailable"));
				return;
			}

			if (subscribeToNewsletter) {
				subscribedToNewsletter = "success";
				const res = await fetch("/api/newsletter", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email,
						name: `${firstName} ${lastName}`,
					}),
				});
				if (!res.ok) {
					subscribedToNewsletter = "failed";
				}
			}

			onSuccess?.(subscribedToNewsletter);
		} catch {
			setErrorMessage(t("auth.register.unavailable"));
		} finally {
			setIsLoading(false);
		}
	};

	const formConfig: FormWrapperConfig = {
		fields: [
			{
				name: "registerSection",
				layout: { columns: 2 },
				fieldGap: "gap-6",
				type: "section",
				className: "mt-8",
				fields: [
					{
						name: "accountType",
						label: t("auth.register.accountType"),
						type: "select",
						layout: { span: "full" },
						className: "mt-8",
						requiredMessage: t("auth.validation.accountTypeRequired"),
						disabled: isLoading,
						allowNullOption: true,
						nullOptionLabel: t("common.selectPlaceholder", {
							defaultValue: "Select an option",
						}),
						placeholder: t("auth.register.accountTypePlaceholder"),
						options: [
							{
								value: "organization",
								label: t("auth.register.accountTypeOrganization"),
							},
							{
								value: "district",
								label: t("auth.register.accountTypeDistrict"),
							},
							{
								value: "administration",
								label: t("auth.register.accountTypeAdministration"),
							},
						],
					},
					{
						name: "organization_section",
						type: "section",
						condition: (formData) => formData.accountType === "organization",
						cardVariant: "none",
						layout: { span: "full", columns: 1 },
						className: "bg-neutral-10 p-4 w-full",
						fields: [
							{
								name: "organizationName",
								label: t("auth.register.organizationName"),
								type: "text",
								requiredMessage: t("auth.validation.organizationNameRequired"),
								disabled: isLoading,
								placeholder: t("auth.register.organizationNamePlaceholder"),
							},
							{
								name: "organizationPosition",
								label: t("auth.register.organizationPosition"),
								type: "text",
								requiredMessage: t(
									"auth.validation.organizationPositionRequired",
								),
								disabled: isLoading,
								placeholder: t("auth.register.organizationPositionPlaceholder"),
							},
							{
								name: "organizationPhone",
								label: t("auth.register.organizationPhone"),
								type: "text",
								requiredMessage: t("auth.validation.organizationPhoneRequired"),
								disabled: isLoading,
								placeholder: t("auth.register.organizationPhonePlaceholder"),
							},
						],
					},
					{
						name: "district_section",
						type: "section",
						condition: (formData) => formData.accountType === "district",
						cardVariant: "none",
						layout: { span: "full", columns: 1 },
						className: "bg-neutral-10 p-4 w-full",
						fields: [
							{
								name: "districtName",
								label: t("auth.register.districtName"),
								type: "text",
								requiredMessage: t("auth.validation.districtNameRequired"),
								disabled: isLoading,
								placeholder: t("auth.register.districtNamePlaceholder"),
							},
							{
								name: "districtOffice",
								label: t("auth.register.districtOffice"),
								type: "text",
								requiredMessage: t("auth.validation.districtOfficeRequired"),
								disabled: isLoading,
								placeholder: t("auth.register.districtOfficePlaceholder"),
							},
							{
								name: "districtPosition",
								label: t("auth.register.districtPosition"),
								type: "text",
								requiredMessage: t("auth.validation.districtPositionRequired"),
								disabled: isLoading,
								placeholder: t("auth.register.districtPositionPlaceholder"),
							},
							{
								name: "districtPhone",
								label: t("auth.register.districtPhone"),
								type: "text",
								requiredMessage: t("auth.validation.districtPhoneRequired"),
								disabled: isLoading,
								placeholder: t("auth.register.districtPhonePlaceholder"),
							},
						],
					},
					{
						name: "administration_section",
						type: "section",
						condition: (formData) => formData.accountType === "administration",
						cardVariant: "none",
						layout: { span: "full", columns: 1 },
						className: "bg-neutral-10 p-4 w-full",
						fields: [
							{
								name: "administrationName",
								label: t("auth.register.administrationName"),
								type: "text",
								requiredMessage: t(
									"auth.validation.administrationNameRequired",
								),
								disabled: isLoading,
								placeholder: t("auth.register.administrationNamePlaceholder"),
							},
							{
								name: "administrationPosition",
								label: t("auth.register.administrationPosition"),
								type: "text",
								requiredMessage: t(
									"auth.validation.administrationPositionRequired",
								),
								disabled: isLoading,
								placeholder: t(
									"auth.register.administrationPositionPlaceholder",
								),
							},
							{
								name: "administrationPhone",
								label: t("auth.register.administrationPhone"),
								type: "text",
								requiredMessage: t(
									"auth.validation.administrationPhoneRequired",
								),
								disabled: isLoading,
								placeholder: t("auth.register.administrationPhonePlaceholder"),
							},
						],
					},
					{
						name: "firstName",
						label: t("auth.register.firstName"),
						type: "text",
						required: true,
						requiredMessage: t("auth.validation.firstNameRequired"),
						disabled: isLoading,
						placeholder: t("auth.register.firstNamePlaceholder"),
						layout: { span: "half" },
					},
					{
						name: "lastName",
						label: t("auth.register.lastName"),
						type: "text",
						required: true,
						disabled: isLoading,
						placeholder: t("auth.register.lastNamePlaceholder"),
						layout: { span: "half" },
					},
					{
						name: "email",
						label: t("auth.register.emailLabel"),
						type: "email",
						required: true,
						requiredMessage: t("auth.validation.emailRequired"),
						disabled: isLoading,
						layout: { span: "full" },
						placeholder: t("auth.register.emailPlaceholder"),
						validators: [emailValidator(t("auth.validation.emailInvalid"))],
					},
					{
						name: "password",
						label: t("auth.register.passwordLabel"),
						type: "password",
						required: true,
						requiredMessage: t("auth.validation.passwordRequired"),
						disabled: isLoading,
						layout: { span: "full" },
						afterField: t("auth.accountEdit.passwordRequirements"),
						placeholder: t("auth.register.passwordPlaceholder"),
						validators: [minLength(8, t("auth.validation.passwordMin"))],
					},
					{
						name: "confirmPassword",
						label: t("auth.register.confirmPassword"),
						type: "password",
						required: true,
						layout: { span: "full" },
						requiredMessage: t("auth.validation.passwordRequired"),
						disabled: isLoading,
						placeholder: t("auth.register.confirmPasswordPlaceholder"),
						validators: [
							matchesField("password", t("auth.validation.passwordMismatch")),
						],
					},
				],
			},
			{
				name: "privacySection",
				type: "section",
				cardVariant: "none",
				fields: [
					{
						name: "acceptTerms",
						label: t("auth.register.privacyLink"),
						labelNode: (
							<span className="body2 font-normal flex-wrap">
								{t("auth.register.termsIntro")}{" "}
								<Link
									href={toLocalePath("/terms")}
									className="text-primary-dark underline"
								>
									{t("auth.register.termsLink")}
								</Link>
							</span>
						),
						type: "checkbox",
						required: true,
						requiredMessage: t("auth.validation.acceptTermsRequired"),
						disabled: isLoading,
					},
					{
						name: "subscribeNewsletter",
						label: t("auth.register.newsletterOptInPrefix"),
						labelNode: (
							<span className="body2 font-normal">
								{t("auth.register.newsletterOptInPrefix")}{" "}
								<Link
									href="/newsletter"
									className="text-primary-dark underline"
								>
									{t("auth.register.newsletterLink")}
								</Link>
							</span>
						),
						type: "checkbox",
						disabled: isLoading,
					},
				],
			},
		],
		onSubmit: handleSubmit,
		layout: { columns: 1 },
		submitLabel: isLoading
			? t("auth.register.submitting")
			: t("auth.register.submit"),
		submitDisabled: isLoading,
	};

	return (
		<div className="w-full md:max-w-3xl mx-auto ">
			<div className="text-start font-bold">
				<h1 className="">{t("auth.register.title")}</h1>
				<p className="body1">{t("auth.register.subtitle")}</p>
			</div>

			<AlertDialog
				title={t("error")}
				status="error"
				description={errorMessage ?? ""}
				open={Boolean(errorMessage)}
				onOpenChange={(open) => {
					if (!open) {
						setErrorMessage(null);
					}
				}}
				confirmLabel={t("close")}
				onConfirm={() => setErrorMessage(null)}
			/>

			<FormWrapper config={formConfig} />

			<div className="flex flex-col items-center text-center pt-2 mt-6">
				<span className="">{t("auth.register.alreadyAccount")} </span>
				<Link
					href={toLocalePath("/login")}
					className="text-primary-dark underline"
				>
					{t("auth.register.signIn")}
				</Link>
			</div>
		</div>
	);
}
