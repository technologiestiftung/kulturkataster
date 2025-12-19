import type { Metadata } from "next";
import { LoginForm } from "@/components/Auth/LoginForm";

export const metadata: Metadata = {
	title: "Login – Kulturkataster",
};

export default function LoginPage() {
	return (
		<div className="flex min-h-full items-center justify-center py-12 px-4">
			<LoginForm />
		</div>
	);
}
