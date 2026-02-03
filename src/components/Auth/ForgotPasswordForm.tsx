"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { requestPasswordReset } from "@/server/actions/auth";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { AlertDialog } from "@/components/ui/alert-dialog";

export function ForgotPasswordForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showSuccess, setShowSuccess] = useState(false);
	const router = useRouter();
	const { t } = useTranslation("common");

	const handleSubmit = async (data: Record<string, unknown>) => {
		const email = String(data.email ?? "");
		setIsLoading(true);
		setErrorMessage(null);

		try {
			const result = await requestPasswordReset(email);
			if (!result.ok) {
				setErrorMessage(result.error ?? t("auth.forgot.errorFallback"));
				return;
			}
			setShowSuccess(true);
		} catch {
			setErrorMessage(t("auth.forgot.errorFallback"));
		} finally {
			setIsLoading(false);
		}
	};

	const formConfig: FormWrapperConfig = {
		onSubmit: handleSubmit,
		showCancel: true,
		cancelLabel: t("auth.forgot.backToSignIn"),
		onCancel: () => router.replace("/login"),
		submitLabel: isLoading
			? t("auth.forgot.submitting")
			: t("auth.forgot.submit"),
		submitDisabled: isLoading,
		layout: { columns: 1 },
		fields: [
			{
				name: "section",
				type: "section",
				cardVariant: "secondary",
				fields: [
					{
						name: "email",
						label: t("auth.forgot.emailLabel"),
						type: "email",
						placeholder: t("auth.forgot.emailPlaceholder"),
						required: true,
						disabled: isLoading,
					},
				],
			},
		],
	};

	return (
		<div className="w-full max-w-3xl mx-auto">
			<div className="text-start font-bold mb-10">
				<h1 className="">{t("auth.forgot.title")}</h1>
				<p className="">{t("auth.forgot.subtitle")}</p>
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

			<AlertDialog
				title={t("auth.forgot.successTitle")}
				status="success"
				description={t("auth.forgot.successMessage")}
				open={showSuccess}
				onOpenChange={(open) => {
					if (!open) {
						setShowSuccess(false);
					}
				}}
				confirmLabel={t("auth.forgot.successCta")}
				onConfirm={() => {
					setShowSuccess(false);
					router.replace("/login");
				}}
			/>

			<FormWrapper config={formConfig} />
		</div>
	);
}
