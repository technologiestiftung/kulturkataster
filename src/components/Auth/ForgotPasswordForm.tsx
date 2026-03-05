"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { requestPasswordReset } from "@/server/actions/auth";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

export function ForgotPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const router = useRouter();
	const toLocalePath = useLocalePath();
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
			if (onSuccess) {
				onSuccess();
				return;
			}
			router.replace(toLocalePath("/login"));
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
		onCancel: () => router.replace(toLocalePath("/login")),
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
		<div className="w-full md:max-w-3xl mx-auto">
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

			<FormWrapper config={formConfig} />
		</div>
	);
}
