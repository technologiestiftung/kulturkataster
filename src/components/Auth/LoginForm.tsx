"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { loginWithEmailPassword } from "@/server/actions/auth";
import { FormWrapper } from "@/components/FormWrapper";
import { AlertDialog } from "@/components/ui/alert-dialog";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { Button } from "../ui/button";

export function LoginForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation("common");

	const navigateToAccount = () => {
		const accountPath = toLocalePath("/account");
		router.replace(accountPath);
	};

	const handleSubmit = async (data: Record<string, unknown>) => {
		const email = String(data.email ?? "");
		const password = String(data.password ?? "");
		setIsLoading(true);
		setErrorMessage(null);

		try {
			const result = await loginWithEmailPassword(email, password);
			if (!result.ok) {
				let fallback: string;
				if (result.error === "banned") {
					fallback = t("auth.login.inactive");
				} else if (result.error === "invalid_credentials") {
					fallback = t("auth.login.invalidCredentials");
				} else {
					fallback = t("auth.login.errorFallback");
				}
				setErrorMessage(fallback);
				return;
			}
			navigateToAccount();
		} catch {
			setErrorMessage(t("auth.login.errorFallback"));
		} finally {
			setIsLoading(false);
		}
	};

	const formConfig: FormWrapperConfig = {
		onSubmit: handleSubmit,
		submitLabel: isLoading
			? t("auth.login.submitting")
			: t("auth.login.submit"),
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
						label: t("auth.login.emailLabel"),
						type: "email",
						placeholder: t("auth.login.emailPlaceholder"),
						required: true,
						disabled: isLoading,
					},
					{
						name: "password",
						label: t("auth.login.passwordLabel"),
						type: "password",
						placeholder: t("auth.login.passwordPlaceholder"),
						required: true,
						disabled: isLoading,
						afterField: (
							<div className="flex justify-end">
								<Button
									type="button"
									variant="tertiary"
									fullWidth={false}
									size="inline"
									className="underline body2"
									onClick={() => router.push(toLocalePath("/forgotPassword"))}
									disabled={isLoading}
								>
									{t("auth.login.forgotPassword")}
								</Button>
							</div>
						),
					},
				],
			},
		],
	};

	return (
		<div className="w-full md:max-w-3xl mx-auto">
			<div className="text-start font-bold mb-10">
				<h1 className="">{t("auth.login.title")}</h1>
				<p className="">{t("auth.login.subtitle")}</p>
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

			<FormWrapper config={formConfig} />

			<div className="flex flex-col items-center text-center mt-2">
				<span className="">{t("auth.login.noAccount")} </span>
				<Button
					type="button"
					variant="tertiary"
					size="inline"
					className="underline body2"
					onClick={() => router.push(toLocalePath("/register"))}
					disabled={isLoading}
				>
					{t("auth.login.signUp")}
				</Button>
			</div>
		</div>
	);
}
