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
import { subscribeToNewsletter } from "@/server/actions/newsletter";
import { NewsletterSubscriptionStatus } from "@/types/newsletter";

export function RegisterForm({
	onSuccess,
}: {
	onSuccess?: (subscribedToNewsletter: NewsletterSubscriptionStatus) => void;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const toLocalePath = useLocalePath();
	const { t } = useTranslation();

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
		const wantsNewsletterSubscription = Boolean(data.subscribeNewsletter);
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
				setErrorMessage(t("common.auth.register.unavailable"));
				return;
			}

			if (wantsNewsletterSubscription) {
				const newsletterResult = await subscribeToNewsletter({
					email,
					name: `${firstName} ${lastName}`,
				});
				if (newsletterResult.ok) {
					subscribedToNewsletter = "success";
				} else {
					subscribedToNewsletter = "failed";
				}
			}

			onSuccess?.(subscribedToNewsletter);
		} catch {
			setErrorMessage(t("common.auth.register.unavailable"));
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
						label: t("common.auth.register.accountType"),
						type: "select",
						layout: { span: "full" },
						className: "mt-8",
						requiredMessage: t("common.auth.validation.accountTypeRequired"),
						disabled: isLoading,
						allowNullOption: true,
						nullOptionLabel: t("common.selectPlaceholder", {
							defaultValue: "Select an option",
						}),
						placeholder: t("common.auth.register.accountTypePlaceholder"),
						options: [
							{
								value: "organization",
								label: t("common.auth.register.accountTypeOrganization"),
							},
							{
								value: "district",
								label: t("common.auth.register.accountTypeDistrict"),
							},
							{
								value: "administration",
								label: t("common.auth.register.accountTypeAdministration"),
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
								label: t("common.auth.register.organizationName"),
								type: "text",
								requiredMessage: t(
									"common.auth.validation.organizationNameRequired",
								),
								disabled: isLoading,
								placeholder: t(
									"common.auth.register.organizationNamePlaceholder",
								),
							},
							{
								name: "organizationPosition",
								label: t("common.auth.register.organizationPosition"),
								type: "text",
								requiredMessage: t(
									"common.auth.validation.organizationPositionRequired",
								),
								disabled: isLoading,
								placeholder: t(
									"common.auth.register.organizationPositionPlaceholder",
								),
							},
							{
								name: "organizationPhone",
								label: t("common.auth.register.organizationPhone"),
								type: "text",
								requiredMessage: t(
									"common.auth.validation.organizationPhoneRequired",
								),
								disabled: isLoading,
								placeholder: t(
									"common.auth.register.organizationPhonePlaceholder",
								),
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
								label: t("common.auth.register.districtName"),
								type: "text",
								requiredMessage: t(
									"common.auth.validation.districtNameRequired",
								),
								disabled: isLoading,
								placeholder: t("common.auth.register.districtNamePlaceholder"),
							},
							{
								name: "districtOffice",
								label: t("common.auth.register.districtOffice"),
								type: "text",
								requiredMessage: t(
									"common.auth.validation.districtOfficeRequired",
								),
								disabled: isLoading,
								placeholder: t(
									"common.auth.register.districtOfficePlaceholder",
								),
							},
							{
								name: "districtPosition",
								label: t("common.auth.register.districtPosition"),
								type: "text",
								requiredMessage: t(
									"common.auth.validation.districtPositionRequired",
								),
								disabled: isLoading,
								placeholder: t(
									"common.auth.register.districtPositionPlaceholder",
								),
							},
							{
								name: "districtPhone",
								label: t("common.auth.register.districtPhone"),
								type: "text",
								requiredMessage: t(
									"common.auth.validation.districtPhoneRequired",
								),
								disabled: isLoading,
								placeholder: t("common.auth.register.districtPhonePlaceholder"),
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
								label: t("common.auth.register.administrationName"),
								type: "text",
								requiredMessage: t(
									"common.auth.validation.administrationNameRequired",
								),
								disabled: isLoading,
								placeholder: t(
									"common.auth.register.administrationNamePlaceholder",
								),
							},
							{
								name: "administrationPosition",
								label: t("common.auth.register.administrationPosition"),
								type: "text",
								requiredMessage: t(
									"common.auth.validation.administrationPositionRequired",
								),
								disabled: isLoading,
								placeholder: t(
									"common.auth.register.administrationPositionPlaceholder",
								),
							},
							{
								name: "administrationPhone",
								label: t("common.auth.register.administrationPhone"),
								type: "text",
								requiredMessage: t(
									"common.auth.validation.administrationPhoneRequired",
								),
								disabled: isLoading,
								placeholder: t(
									"common.auth.register.administrationPhonePlaceholder",
								),
							},
						],
					},
					{
						name: "firstName",
						label: t("common.auth.register.firstName"),
						type: "text",
						required: true,
						requiredMessage: t("common.auth.validation.firstNameRequired"),
						disabled: isLoading,
						placeholder: t("common.auth.register.firstNamePlaceholder"),
						layout: { span: "half" },
					},
					{
						name: "lastName",
						label: t("common.auth.register.lastName"),
						type: "text",
						required: true,
						disabled: isLoading,
						placeholder: t("common.auth.register.lastNamePlaceholder"),
						layout: { span: "half" },
					},
					{
						name: "email",
						label: t("common.auth.register.emailLabel"),
						type: "email",
						required: true,
						requiredMessage: t("common.auth.validation.emailRequired"),
						disabled: isLoading,
						layout: { span: "full" },
						placeholder: t("common.auth.register.emailPlaceholder"),
						validators: [
							emailValidator(t("common.auth.validation.emailInvalid")),
						],
					},
					{
						name: "password",
						label: t("common.auth.register.passwordLabel"),
						type: "password",
						required: true,
						requiredMessage: t("common.auth.validation.passwordRequired"),
						disabled: isLoading,
						layout: { span: "full" },
						afterField: t("common.auth.accountEdit.passwordRequirements"),
						placeholder: t("common.auth.register.passwordPlaceholder"),
						validators: [minLength(8, t("common.auth.validation.passwordMin"))],
					},
					{
						name: "confirmPassword",
						label: t("common.auth.register.confirmPassword"),
						type: "password",
						required: true,
						layout: { span: "full" },
						requiredMessage: t("common.auth.validation.passwordRequired"),
						disabled: isLoading,
						placeholder: t("common.auth.register.confirmPasswordPlaceholder"),
						validators: [
							matchesField(
								"password",
								t("common.auth.validation.passwordMismatch"),
							),
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
						label: t("common.auth.register.privacyLink"),
						labelNode: (
							<span className="body2 font-normal flex-wrap">
								{t("common.auth.register.termsIntro")}{" "}
								<Link
									href={toLocalePath("/terms")}
									className="text-primary-dark underline"
								>
									{t("common.auth.register.termsLink")}
								</Link>
							</span>
						),

						type: "checkbox",
						required: true,
						requiredMessage: t("common.auth.validation.acceptTermsRequired"),
						disabled: isLoading,
					},
					{
						name: "subscribeNewsletter",
						label: t("common.auth.register.newsletterOptInPrefix"),
						labelNode: (
							<span className="body2 font-normal">
								{t("common.auth.register.newsletterOptInPrefix")}{" "}
								<Link
									href="/newsletter"
									className="text-primary-dark underline"
								>
									{t("common.auth.register.newsletterLink")}
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
			? t("common.auth.register.submitting")
			: t("common.auth.register.submit"),
		submitDisabled: isLoading,
	};

	return (
		<div className="w-full md:max-w-3xl mx-auto ">
			<div className="text-start font-bold">
				<h1 className="">{t("common.auth.register.title")}</h1>
				<p className="body1">{t("common.auth.register.subtitle")}</p>
			</div>

			<AlertDialog
				title={t("common.error")}
				status="error"
				description={errorMessage ?? ""}
				open={Boolean(errorMessage)}
				onOpenChange={(open) => {
					if (!open) {
						setErrorMessage(null);
					}
				}}
				confirmLabel={t("common.close")}
				onConfirm={() => setErrorMessage(null)}
			/>

			<FormWrapper config={formConfig} />

			<div className="flex flex-col items-center text-center pt-2 mt-6">
				<span className="">{t("common.auth.register.alreadyAccount")} </span>
				<Link
					href={toLocalePath("/login")}
					className="text-primary-dark underline"
				>
					{t("common.auth.register.signIn")}
				</Link>
			</div>
		</div>
	);
}
