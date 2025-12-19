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

export function RegisterForm() {
	const [formData, setFormData] = useState({
		name: "",
		lastName: "",
		accountType: "",
		email: "",
		password: "",
		confirmPassword: "",
		acceptTerms: false,
	});
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = "Name is required";
		}

		if (!formData.accountType) {
			newErrors.accountType = "Account type is required";
		}

		if (!formData.email.trim()) {
			newErrors.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Invalid email address";
		}

		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 8) {
			newErrors.password = "Password must be at least 8 characters";
		}

		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
		}

		if (!formData.acceptTerms) {
			newErrors.acceptTerms = "You must accept the terms and conditions";
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

		// TODO: Implement actual registration logic
		console.log("Registration attempt:", formData);

		// Simulate API call
		setTimeout(() => {
			setIsLoading(false);
		}, 1000);
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
		<div className="w-full max-w-md mx-auto space-y-6">
			<div className="space-y-2 text-start">
				<h1 className="text-3xl font-bold">Create an account</h1>
				<p className="text-muted-foreground">
					Enter your information to get started
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="accountType">Account Type</Label>
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
							<SelectValue placeholder="Select account type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="individual">Individual</SelectItem>
							<SelectItem value="organization">Organization</SelectItem>
						</SelectContent>
					</Select>
					{errors.accountType && (
						<p className="text-sm text-destructive">{errors.accountType}</p>
					)}
				</div>
				<div className="space-y-2 grid grid-cols-2 gap-4">
					<div className="space-y-2 ">
						<Label htmlFor="name">First Name</Label>
						<Input
							id="name"
							type="text"
							placeholder="John Doe"
							value={formData.name}
							onChange={(e) => handleInputChange("name", e.target.value)}
							required
							disabled={isLoading}
							aria-invalid={!!errors.name}
						/>
						{errors.name && (
							<p className="text-sm text-destructive">{errors.name}</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="lastName">Last Name</Label>
						<Input
							id="lastName"
							type="text"
							placeholder="Doe"
							value={formData.lastName}
							onChange={(e) => handleInputChange("lastName", e.target.value)}
							required
							disabled={isLoading}
							aria-invalid={!!errors.lastName}
						/>
						{errors.lastName && (
							<p className="text-sm text-destructive">{errors.lastName}</p>
						)}
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="name@example.com"
						value={formData.email}
						onChange={(e) => handleInputChange("email", e.target.value)}
						required
						disabled={isLoading}
						aria-invalid={!!errors.email}
					/>
					{errors.email && (
						<p className="text-sm text-destructive">{errors.email}</p>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input
						id="password"
						type="password"
						placeholder="Create a password"
						value={formData.password}
						onChange={(e) => handleInputChange("password", e.target.value)}
						required
						disabled={isLoading}
						aria-invalid={!!errors.password}
					/>
					{errors.password && (
						<p className="text-sm text-destructive">{errors.password}</p>
					)}
					<p className="text-xs text-muted-foreground">
						Must be at least 8 characters
					</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="confirmPassword">Confirm Password</Label>
					<Input
						id="confirmPassword"
						type="password"
						placeholder="Confirm your password"
						value={formData.confirmPassword}
						onChange={(e) =>
							handleInputChange("confirmPassword", e.target.value)
						}
						required
						disabled={isLoading}
						aria-invalid={!!errors.confirmPassword}
					/>
					{errors.confirmPassword && (
						<p className="text-sm text-destructive">{errors.confirmPassword}</p>
					)}
				</div>

				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading ? "Creating account..." : "Create account"}
				</Button>
				<div className="flex items-start space-x-2">
					<Checkbox
						id="terms"
						checked={formData.acceptTerms}
						onCheckedChange={(checked) =>
							handleInputChange("acceptTerms", checked as boolean)
						}
						disabled={isLoading}
						aria-invalid={!!errors.acceptTerms}
					/>
					<div className="space-y-1">
						<Label
							htmlFor="terms"
							className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							I agree to the{" "}
							<Link
								href="/terms"
								className="text-primary hover:underline"
								target="_blank"
							>
								Terms of Service
							</Link>{" "}
							and{" "}
							<Link
								href="/privacy"
								className="text-primary hover:underline"
								target="_blank"
							>
								Privacy Policy
							</Link>
						</Label>
						{errors.acceptTerms && (
							<p className="text-sm text-destructive">{errors.acceptTerms}</p>
						)}
					</div>
				</div>
				<div className="flex items-start space-x-2">
					<Checkbox
						id="terms"
						checked={formData.acceptTerms}
						onCheckedChange={(checked) =>
							handleInputChange("acceptTerms", checked as boolean)
						}
						disabled={isLoading}
						aria-invalid={!!errors.acceptTerms}
					/>
					<div className="space-y-1">
						<Label
							htmlFor="terms"
							className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						>
							I agree to the{" "}
							<Link
								href="/terms"
								className="text-primary hover:underline"
								target="_blank"
							>
								Terms of Service
							</Link>{" "}
							and{" "}
							<Link
								href="/privacy"
								className="text-primary hover:underline"
								target="_blank"
							>
								Privacy Policy
							</Link>
						</Label>
						{errors.acceptTerms && (
							<p className="text-sm text-destructive">{errors.acceptTerms}</p>
						)}
					</div>
				</div>
			</form>

			<div className="text-center text-sm">
				<span className="text-muted-foreground">Already have an account? </span>
				<Link
					href="/account/login"
					className="text-primary hover:underline font-medium"
				>
					Sign in
				</Link>
			</div>
		</div>
	);
}
