import type { Metadata } from "next";
import { RegisterForm } from "@/components/Auth/RegisterForm";
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
		title: t("auth.register.metaTitle"),
	};
}

export default async function RegisterPage() {
	const user = await getCurrentUser();
	if (user) {
		redirect("/account");
	}

	return (
		<div className="w-full flex flex-1 items-center justify-center py-12 px-4">
			<RegisterForm />
		</div>
	);
}
