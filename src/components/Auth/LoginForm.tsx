"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { loginWithEmailPassword } from "@/server/actions/auth";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";

export function LoginForm() {
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const router = useRouter();
	const { t } = useTranslation("common");

	const navigateToAccount = () => {
		const accountPath = `/account`;
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
				setErrorMessage(result.error ?? t("auth.login.errorFallback"));
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
								<Link
									href="/forgot-password"
									className="text-primary-dark body2 underline"
								>
									{t("auth.login.forgotPassword")}
								</Link>
							</div>
						),
					},
				],
			},
		],
	};

	return (
		<div className="w-full max-w-3xl mx-auto">
			<div className="text-start font-bold mb-10">
				<h1 className="">{t("auth.login.title")}</h1>
				<p className="">{t("auth.login.subtitle")}</p>
			</div>

			{errorMessage && <p className="body3 text-destructive">{errorMessage}</p>}

			<FormWrapper config={formConfig} />

			<div className="flex flex-col items-center text-center mt-2">
				<span className="">{t("auth.login.noAccount")} </span>
				<Link href="/register" className="text-primary-dark underline ">
					{t("auth.login.signUp")}
				</Link>
			</div>
		</div>
	);
}
