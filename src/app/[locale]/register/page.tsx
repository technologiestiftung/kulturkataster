import type { Metadata } from "next";
import { RegisterForm } from "@/components/Auth/RegisterForm";

export const metadata: Metadata = {
	title: "Register – Kulturkataster",
};

export default function RegisterPage() {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
			<RegisterForm />
		</div>
	);
}
