import type { Metadata } from "next";
import { LoginForm } from "@/components/Auth/LoginForm";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { serverSideTranslation } from "@/i18n";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale, ["common"]);
	return {
		title: t("auth.login.metaTitle"),
	};
}

export default async function LoginPage() {
	const user = await getCurrentUser();
	if (user) {
		redirect("/account");
	}

	return (
		<div className="flex min-h-full items-center justify-center py-12 px-4">
			<LoginForm />
		</div>
	);
}
