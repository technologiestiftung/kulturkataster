"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { loginWithEmailPassword } from "@/server/actions/auth";
import { FormWrapper } from "@/components/FormWrapper";
import { AlertDialog } from "@/components/ui/alert-dialog";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function LoginForm() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isRedirecting, setIsRedirecting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation();

	const accountPath = toLocalePath("/account/activity");
	const isBusy = isSubmitting || isRedirecting;

	useEffect(() => {
		router.prefetch(accountPath);
	}, [accountPath, router]);

	const handleSubmit = async (data: Record<string, unknown>) => {
		const email = String(data.email ?? "");
		const password = String(data.password ?? "");
		let shouldKeepBusyState = false;
		setIsSubmitting(true);
		setIsRedirecting(false);
		setErrorMessage(null);

		try {
			const result = await loginWithEmailPassword(email, password);
			if (!result.ok) {
				let fallback: string;
				if (result.error === "banned") {
					fallback = t("common.auth.login.inactive");
				} else if (result.error === "invalid_credentials") {
					fallback = t("common.auth.login.invalidCredentials");
				} else {
					fallback = t("common.auth.login.errorFallback");
				}
				setErrorMessage(fallback);
				return;
			}
			shouldKeepBusyState = true;
			setIsRedirecting(true);
			router.replace(accountPath);
		} catch {
			setErrorMessage(t("common.auth.login.errorFallback"));
		} finally {
			if (!shouldKeepBusyState) {
				setIsSubmitting(false);
			}
		}
	};

	const formConfig: FormWrapperConfig = {
		onSubmit: handleSubmit,
		submitLabel: isBusy
			? t("common.auth.login.submitting")
			: t("common.auth.login.submit"),
		submitDisabled: isBusy,
		layout: { columns: 1 },
		fields: [
			{
				name: "section",
				type: "section",
				cardVariant: "secondary",
				fields: [
					{
						name: "email",
						label: t("common.auth.login.emailLabel"),
						type: "email",
						autoComplete: "email",
						placeholder: t("common.auth.login.emailPlaceholder"),
						required: true,
						disabled: isBusy,
					},
					{
						name: "password",
						label: t("common.auth.login.passwordLabel"),
						type: "password",
						autoComplete: "current-password",
						placeholder: t("common.auth.login.passwordPlaceholder"),
						required: true,
						disabled: isBusy,
						afterField: (
							<div className="flex justify-end">
								<Button
									asChild
									variant="tertiary"
									fullWidth={false}
									size="inline"
									className={cn(
										"underline body2",
										isBusy && "pointer-events-none opacity-50",
									)}
								>
									<Link
										href={toLocalePath("/forgotPassword")}
										aria-disabled={isBusy || undefined}
										tabIndex={isBusy ? -1 : undefined}
									>
										{t("common.auth.login.forgotPassword")}
									</Link>
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
				<h1 className="">{t("common.auth.login.title")}</h1>
				<p className="">{t("common.auth.login.subtitle")}</p>
			</div>

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

			<div className="flex flex-col items-center text-center mt-2">
				<span className="">{t("common.auth.login.noAccount")} </span>
				<Button
					asChild
					variant="tertiary"
					size="inline"
					className={cn(
						"underline body2",
						isBusy && "pointer-events-none opacity-50",
					)}
				>
					<Link
						href={toLocalePath("/register")}
						aria-disabled={isBusy || undefined}
						tabIndex={isBusy ? -1 : undefined}
					>
						{t("common.auth.login.signUp")}
					</Link>
				</Button>
			</div>
		</div>
	);
}
