"use client";

import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { FormWrapper } from "@/components/FormWrapper";
import { AlertDialog } from "@/components/ui/alert-dialog";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { subscribeToNewsletter } from "@/server/actions/newsletter";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

export function NewsletterForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { t } = useTranslation("common");
	const router = useRouter();
	const toLocalePath = useLocalePath();

	const handleSubmit = async (data: Record<string, unknown>) => {
		const email = String(data.email ?? "");
		const name = String(data.name ?? "");
		setIsLoading(true);
		setErrorMessage(null);

		try {
			const result = await subscribeToNewsletter({
				email,
				name,
			});

			if (!result.ok) {
				throw new Error();
			}
			setShowSuccess(true);
		} catch {
			setErrorMessage(t("auth.newsletter.errorFallback"));
		} finally {
			setIsLoading(false);
		}
	};

	const formConfig: FormWrapperConfig = {
		onSubmit: handleSubmit,
		submitLabel: isLoading
			? t("auth.newsletter.submitting")
			: t("auth.newsletter.submit"),
		submitDisabled: isLoading,
		layout: { columns: 1 },
		fields: [
			{
				name: "section",
				type: "section",
				cardVariant: "secondary",
				fields: [
					{
						name: "name",
						label: t("auth.newsletter.nameLabel"),
						type: "text",
						disabled: isLoading,
					},
					{
						name: "email",
						label: t("auth.newsletter.emailLabel"),
						type: "text",
						required: true,
						disabled: isLoading,
					},
				],
			},
			{
				name: "consentSection",
				type: "section",
				cardVariant: "none",
				fields: [
					{
						name: "acceptTerms",
						label: t("auth.newsletter.consentLabel"),
						type: "checkbox",
						required: true,
						requiredMessage: t("auth.newsletter.consentRequired"),
						disabled: isLoading,
						hideRequiredIndicator: true,
					},
				],
			},
		],
	};

	return (
		<div className="w-full md:max-w-3xl mx-auto">
			<div className="text-start font-bold mb-10">
				<h1 className="">
					{t(`auth.newsletter.${showSuccess ? "thankYou" : "title"}`)}
				</h1>
				{showSuccess ? (
					<p className="text-foreground">
						{t("auth.newsletter.successMessageMail")}
					</p>
				) : (
					<div className="font-normal">
						<Trans
							i18nKey="auth.newsletter.subtitle"
							ns="content"
							components={{
								link: (
									<a
										href="https://dsgvo-info.cortina-consult.de/kulturkataster/"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary-dark hover:text-primary underline"
									>
										{t("auth.newsletter.privacyLink")}
									</a>
								),
							}}
						/>
					</div>
				)}
			</div>

			<AlertDialog
				title={t("alert.errorInput")}
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

			{showSuccess ? (
				<Button
					variant="primary"
					className="w-full"
					onClick={() => router.replace(toLocalePath("/map"))}
				>
					{t("auth.newsletter.successCta", {
						defaultValue: "Fertig",
					})}
				</Button>
			) : (
				<FormWrapper config={formConfig} />
			)}
		</div>
	);
}
