"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormWrapper } from "@/components/FormWrapper";
import { AlertDialog } from "@/components/ui/alert-dialog";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { subscribeToNewsletter } from "@/server/actions/newsletter";

export function NewsletterForm({ onSuccess }: { onSuccess?: () => void }) {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const { t } = useTranslation();

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
			onSuccess?.();
		} catch {
			setErrorMessage(t("common.auth.newsletter.errorFallback"));
		} finally {
			setIsLoading(false);
		}
	};

	const formConfig: FormWrapperConfig = {
		onSubmit: handleSubmit,
		submitLabel: isLoading
			? t("common.auth.newsletter.submitting")
			: t("common.auth.newsletter.submit"),
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
						label: t("common.auth.newsletter.nameLabel"),
						type: "text",
						autoComplete: "name",
						disabled: isLoading,
					},
					{
						name: "email",
						label: t("common.auth.newsletter.emailLabel"),
						type: "text",
						autoComplete: "email",
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
						label: t("common.auth.newsletter.consentLabel"),
						type: "checkbox",
						required: true,
						requiredMessage: t("common.auth.newsletter.consentRequired"),
						disabled: isLoading,
						hideRequiredIndicator: true,
					},
				],
			},
		],
	};

	return (
		<div>
			<AlertDialog
				title={t("common.alert.errorInput")}
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
		</div>
	);
}
