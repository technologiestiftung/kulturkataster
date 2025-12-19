"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function LoginForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		// TODO: Implement actual login logic
		console.log("Login attempt:", { email, password });

		// Simulate API call
		setTimeout(() => {
			setIsLoading(false);
		}, 1000);
	};

	return (
		<div className="w-full max-w-md mx-auto space-y-6">
			<div className="text-start font-bold">
				<h1 className="">Welcome back</h1>
				<p className="">Enter your credentials to access your account</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						placeholder="name@example.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						disabled={isLoading}
					/>
				</div>

				<div className="flex flex-col">
					<div className="">
						<Label htmlFor="password">Password</Label>
					</div>
					<Input
						id="password"
						type="password"
						placeholder="Enter your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						disabled={isLoading}
					/>
					<Link
						href="/account/forgot-password"
						className="self-end text-primary-dark body2 underline"
					>
						Forgot password?
					</Link>
				</div>

				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading ? "Signing in..." : "Sign in"}
				</Button>
			</form>

			<div className="text-center text-sm">
				<span className="">Dont have an account? </span>
				<Link
					href="/account/register"
					className="text-primary hover:underline "
				>
					Sign up
				</Link>
			</div>
		</div>
	);
}
