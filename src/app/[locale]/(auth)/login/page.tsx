import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { serverSideTranslation } from "@/i18n";
import { LoginModal } from "@/components/Modals/Pages/LoginModal";
import { getCurrentUser } from "@/server/auth/getCurrentUser";

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
		redirect("/account/activity");
	}

	return <LoginModal routePath="/login" closeTo="/" />;
}
