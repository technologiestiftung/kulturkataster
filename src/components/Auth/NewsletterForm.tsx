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
	const { t } = useTranslation("common");

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
		<div>
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
			<FormWrapper config={formConfig} />
		</div>
	);
}
