"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { setPasswordWithTokens } from "@/server/actions/auth";

export function ResetPasswordForm() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [hasToken, setHasToken] = useState(false);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [refreshToken, setRefreshToken] = useState<string | null>(null);
	const router = useRouter();
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
			setIsReady(true);

			redirect("/");
		}

		setHasToken(true);
		setAccessToken(access);
		setRefreshToken(refresh);

		window.history.replaceState(
			{},
			document.title,
			window.location.pathname + window.location.search,
		);
		setIsReady(true);
	}, []);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setErrorMessage(null);

		try {
			if (!hasToken || !accessToken || !refreshToken) {
				setErrorMessage(t("auth.reset.missingToken"));
				return;
			}

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

			const accountPath = "/account";
			router.replace(accountPath);
		} catch {
			setErrorMessage(t("auth.reset.errorFallback"));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full max-w-2xl mx-auto space-y-6">
			<div className="text-start font-bold">
				<h1 className="">{t("auth.reset.title")}</h1>
				<p className="">{t("auth.reset.subtitle")}</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				{errorMessage && (
					<p className="body3 text-destructive">{errorMessage}</p>
				)}

				{!isReady ? (
					<p className="body3 text-foreground">{t("auth.reset.loading")}</p>
				) : (
					<>
						{!hasToken && (
							<p className="body3 text-foreground">
								{t("auth.reset.missingToken")}
							</p>
						)}

						<div className="space-y-2">
							<Label htmlFor="password" required>
								{t("auth.reset.newPasswordLabel")}
							</Label>
							<Input
								id="password"
								type="password"
								placeholder={t("auth.reset.newPasswordPlaceholder")}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirmPassword" required>
								{t("auth.reset.confirmPasswordLabel")}
							</Label>
							<Input
								id="confirmPassword"
								type="password"
								placeholder={t("auth.reset.confirmPasswordPlaceholder")}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								disabled={isLoading}
							/>
						</div>
					</>
				)}

				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading ? t("auth.reset.submitting") : t("auth.reset.submit")}
				</Button>
			</form>

			<div className="flex flex-col items-center text-center">
				<Link href="/login" className="text-primary-dark underline ">
					{t("auth.reset.backToLogin")}
				</Link>
			</div>
		</div>
	);
}
