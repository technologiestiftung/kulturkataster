"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerWithEmailPassword } from "@/server/actions/auth";
import { useTranslation } from "react-i18next";

export function RegisterForm() {
	const [formData, setFormData] = useState({
		name: "",
		lastName: "",
		accountType: "",
		email: "",
		password: "",
		confirmPassword: "",
		acceptTerms: false,
		subscribeNewsletter: false,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const router = useRouter();
	const { t } = useTranslation("common");

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = t("auth.validation.firstNameRequired");
		}

		if (!formData.accountType) {
			newErrors.accountType = t("auth.validation.accountTypeRequired");
		}

		if (!formData.email.trim()) {
			newErrors.email = t("auth.validation.emailRequired");
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = t("auth.validation.emailInvalid");
		}

		if (!formData.password) {
			newErrors.password = t("auth.validation.passwordRequired");
		} else if (formData.password.length < 8) {
			newErrors.password = t("auth.validation.passwordMin");
		}

		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = t("auth.validation.passwordMismatch");
		}

		if (!formData.acceptTerms) {
			newErrors.acceptTerms = t("auth.validation.acceptTermsRequired");
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsLoading(true);
		setErrorMessage(null);
		setSuccessMessage(null);

		try {
			const result = await registerWithEmailPassword({
				email: formData.email,
				password: formData.password,
				firstName: formData.name,
				lastName: formData.lastName,
				accountType: formData.accountType,
			});
			if (!result.ok) {
				setErrorMessage(result.error ?? t("auth.register.errorFallback"));
				return;
			}
			if (result.needsConfirmation) {
				setSuccessMessage(t("auth.register.confirmEmail"));
				return;
			}
			router.push("/account");
		} catch {
			setErrorMessage(t("auth.register.errorFallback"));
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (field: string, value: string | boolean) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// Clear error for this field when user starts typing
		if (errors[field]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[field];
				return newErrors;
			});
		}
	};

	return (
		<div className="w-full max-w-2xl mx-auto space-y-6">
			<div className="space-y-2 text-start">
				<h1 className="text-3xl font-bold">{t("auth.register.title")}</h1>
				<p className="text-muted-foreground">{t("auth.register.subtitle")}</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				{errorMessage && <p className="text-destructive">{errorMessage}</p>}
				{successMessage && <p className="text-green-700">{successMessage}</p>}
				<div className="space-y-2">
					<Label htmlFor="accountType">{t("auth.register.accountType")}</Label>
					<Select
						value={formData.accountType}
						onValueChange={(value) => handleInputChange("accountType", value)}
						disabled={isLoading}
					>
						<SelectTrigger
							id="accountType"
							className="w-full"
							aria-invalid={!!errors.accountType}
						>
							<SelectValue
								placeholder={t("auth.register.accountTypePlaceholder")}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="organization">
								{t("auth.register.accountTypeOrganization")}
							</SelectItem>
							<SelectItem value="district">
								{t("auth.register.accountTypeDistrict")}
							</SelectItem>
							<SelectItem value="administration">
								{t("auth.register.accountTypeAdministration")}
							</SelectItem>
						</SelectContent>
					</Select>
					{errors.accountType && (
						<p className="text-destructive">{errors.accountType}</p>
					)}
				</div>
				<div className="space-y-2 grid grid-cols-2 gap-4">
					<div className="space-y-2 ">
						<Label htmlFor="name" required>
							{t("auth.register.firstName")}
						</Label>
						<Input
							id="name"
							type="text"
							placeholder={t("auth.register.firstNamePlaceholder")}
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							required
							disabled={isLoading}
							aria-invalid={!!errors.name}
						/>
						{errors.name && <p className="text-destructive">{errors.name}</p>}
					</div>
					<div className="space-y-2">
						<Label htmlFor="lastName" required>
							{t("auth.register.lastName")}
						</Label>
						<Input
							id="lastName"
							type="text"
							placeholder={t("auth.register.lastNamePlaceholder")}
							value={formData.lastName}
							onChange={(e) => handleInputChange("lastName", e.target.value)}
							required
							disabled={isLoading}
							aria-invalid={!!errors.lastName}
						/>
						{errors.lastName && (
							<p className="text-destructive">{errors.lastName}</p>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email" required>
						{t("auth.register.emailLabel")}
					</Label>
					<Input
						id="email"
						type="email"
						placeholder={t("auth.register.emailPlaceholder")}
						value={formData.email}
						onChange={(e) => handleInputChange("email", e.target.value)}
						required
						disabled={isLoading}
						aria-invalid={!!errors.email}
					/>
					{errors.email && <p className="text-destructive">{errors.email}</p>}
				</div>

				<div className="space-y-2">
					<Label htmlFor="password" required>
						{t("auth.register.passwordLabel")}
					</Label>
					<Input
						id="password"
						type="password"
						placeholder={t("auth.register.passwordPlaceholder")}
						value={formData.password}
						onChange={(e) => handleInputChange("password", e.target.value)}
						required
						disabled={isLoading}
						aria-invalid={!!errors.password}
					/>
					{errors.password && (
						<p className="text-destructive">{errors.password}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="confirmPassword" required>
						{t("auth.register.confirmPassword")}
					</Label>
					<Input
						id="confirmPassword"
						type="password"
						placeholder={t("auth.register.confirmPasswordPlaceholder")}
						value={formData.confirmPassword}
						onChange={(e) =>
							handleInputChange("confirmPassword", e.target.value)
						}
						required
						disabled={isLoading}
						aria-invalid={!!errors.confirmPassword}
					/>
					{errors.confirmPassword && (
						<p className="text-destructive">{errors.confirmPassword}</p>
					)}
				</div>

				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading
						? t("auth.register.submitting")
						: t("auth.register.submit")}
				</Button>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="terms"
						checked={formData.acceptTerms}
						className="border-neutral-80"
						onCheckedChange={(checked) =>
							handleInputChange("acceptTerms", checked as boolean)
						}
						disabled={isLoading}
						aria-invalid={!!errors.acceptTerms}
					/>
					<div className="space-y-1">
						<Label
							htmlFor="terms"
							className="body2 font-normal flex-wrap"
							required
						>
							{t("auth.register.termsIntro")}{" "}
							<Link
								href="/terms"
								className="text-primary-dark underline"
								target="_blank"
							>
								{t("auth.register.termsLink")}
							</Link>{" "}
							{t("auth.register.termsSeparator")}{" "}
							<Link
								href="/privacy"
								className="text-primary-dark underline"
								target="_blank"
							>
								{t("auth.register.privacyLink")}
							</Link>
							{t("auth.register.privacySuffix")}
						</Label>
						{errors.acceptTerms && (
							<p className="text-destructive">{errors.acceptTerms}</p>
						)}
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<Checkbox
						id="newsletter"
						checked={formData.subscribeNewsletter}
						className="border-neutral-80"
						onCheckedChange={(checked) =>
							handleInputChange("subscribeNewsletter", checked as boolean)
						}
						disabled={isLoading}
					/>
					<div className="space-y-1">
						<Label htmlFor="newsletter" className="body2 font-normal ">
							{t("auth.register.newsletterOptInPrefix")}{" "}
							<Link
								href="/newsletter"
								className="text-primary-dark underline"
								target="_blank"
							>
								{t("auth.register.newsletterLink")}
							</Link>
						</Label>
					</div>
				</div>
			</form>

			<div className="flex flex-col items-center text-center">
				<span className="">{t("auth.register.alreadyAccount")} </span>
				<Link href="/auth/login" className="text-primary-dark underline">
					{t("auth.register.signIn")}
				</Link>
			</div>
		</div>
	);
}
