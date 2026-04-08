"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { setPasswordWithTokens } from "@/server/actions/auth";
import { FormWrapper, minLength } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { Button } from "../ui/button";

export function ResetPasswordForm({ onSuccess }: { onSuccess?: () => void }) {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [hasToken, setHasToken] = useState(false);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [refreshToken, setRefreshToken] = useState<string | null>(null);
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation("common");

	useEffect(() => {
		const hash = window.location.hash.startsWith("#")
			? window.location.hash.slice(1)
			: window.location.hash;
		const hashParams = new URLSearchParams(hash);
		const access = hashParams.get("access_token");
		const refresh = hashParams.get("refresh_token");

		if (!access || !refresh) {
			setHasToken(false);
			setErrorMessage(t("auth.reset.missingToken"));
			setIsReady(true);
			return;
		}

		setHasToken(true);
		setAccessToken(access);
		setRefreshToken(refresh);

		setIsReady(true);
	}, [t]);

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (isLoading) return;
		setIsLoading(true);
		setErrorMessage(null);

		try {
			if (!hasToken || !accessToken || !refreshToken) {
				setErrorMessage(t("auth.reset.missingToken"));
				return;
			}

			const password = String(data.password ?? "");
			const confirmPassword = String(data.confirmPassword ?? "");
			if (password !== confirmPassword) {
				setErrorMessage(t("auth.validation.passwordMismatch"));
				return;
			}

			const result = await setPasswordWithTokens({
				accessToken,
				refreshToken,
				password,
			});
			if (!result.ok) {
				setErrorMessage(result.error ?? t("auth.reset.errorFallback"));
				return;
			}
			if (onSuccess) {
				onSuccess();
				return;
			}
			router.replace(toLocalePath("/login"));
		} catch {
			setErrorMessage(t("auth.reset.errorFallback"));
		} finally {
			setIsLoading(false);
		}
	};

	const formConfig: FormWrapperConfig = useMemo(
		() => ({
			onSubmit: handleSubmit,
			submitLabel: isLoading
				? t("auth.reset.submitting")
				: t("auth.reset.submit"),
			submitDisabled: isLoading || !isReady || !hasToken,
			layout: { columns: 1 },
			fields: [
				{
					name: "section",
					type: "section",
					cardVariant: "secondary",
					fields: [
						{
							name: "password",
							label: t("auth.reset.newPasswordLabel"),
							type: "password",
							placeholder: t("auth.reset.newPasswordPlaceholder"),
							required: true,
							afterField: t("auth.reset.passwordRequirements"),
							disabled: isLoading || !isReady || !hasToken,
							validators: [minLength(8, t("auth.validation.passwordMin"))],
						},
						{
							name: "confirmPassword",
							label: t("auth.reset.confirmPasswordLabel"),
							type: "password",
							placeholder: t("auth.reset.confirmPasswordPlaceholder"),
							required: true,
							disabled: isLoading || !isReady || !hasToken,
						},
					],
				},
			],
		}),
		[handleSubmit, hasToken, isLoading, isReady, t],
	);

	return (
		<div className="w-full max-w-2xl mx-auto space-y-6">
			<div className="text-start font-bold">
				<h1 className="">{t("auth.reset.title")}</h1>
				<p className="">{t("auth.reset.subtitle")}</p>
			</div>

			<AlertDialog
				title={t("alert.errorInput")}
				status="error"
				description={errorMessage ?? ""}
				open={Boolean(errorMessage)}
				onOpenChange={(open) => {
					if (!open) setErrorMessage(null);
				}}
				confirmLabel={t("close")}
				onConfirm={() => setErrorMessage(null)}
			/>

			<FormWrapper config={formConfig} />

			<div className="flex flex-col items-center text-center">
				<Button
					type="button"
					variant="tertiary"
					size="inline"
					className="underline body2"
					onClick={() => router.push(toLocalePath("/login"))}
					disabled={isLoading}
				>
					{t("auth.reset.backToLogin")}
				</Button>
			</div>
		</div>
	);
}
