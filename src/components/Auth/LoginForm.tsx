"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { loginWithEmailPassword } from "@/server/actions/auth";

export function LoginForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const router = useRouter();
	const { t } = useTranslation("common");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setErrorMessage(null);

		try {
			const result = await loginWithEmailPassword(email, password);
			if (!result.ok) {
				setErrorMessage(result.error ?? t("auth.login.errorFallback"));
				return;
			}
			router.push("/account");
		} catch {
			setErrorMessage(t("auth.login.errorFallback"));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full max-w-2xl mx-auto space-y-6">
			<div className="text-start font-bold">
				<h1 className="">{t("auth.login.title")}</h1>
				<p className="">{t("auth.login.subtitle")}</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				{errorMessage && (
					<p className="text-sm text-destructive">{errorMessage}</p>
				)}
				<div className="space-y-2">
					<Label htmlFor="email" required>
						{t("auth.login.emailLabel")}
					</Label>
					<Input
						id="email"
						type="email"
						placeholder={t("auth.login.emailPlaceholder")}
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						disabled={isLoading}
					/>
				</div>

				<div className="flex flex-col">
					<div className="">
						<Label htmlFor="password" required>
							{t("auth.login.passwordLabel")}
						</Label>
					</div>
					<Input
						id="password"
						type="password"
						placeholder={t("auth.login.passwordPlaceholder")}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						disabled={isLoading}
					/>
					<Link
						href="/forgot-password"
						className="self-end text-primary-dark body2 underline"
					>
						{t("auth.login.forgotPassword")}
					</Link>
				</div>

				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading ? t("auth.login.submitting") : t("auth.login.submit")}
				</Button>
			</form>

			<div className="text-center text-sm">
				<span className="">{t("auth.login.noAccount")} </span>
				<Link href="/register" className="text-primary hover:underline ">
					{t("auth.login.signUp")}
				</Link>
			</div>
		</div>
	);
}
