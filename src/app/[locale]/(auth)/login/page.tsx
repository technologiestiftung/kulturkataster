import type { Metadata } from "next";
import { serverSideTranslation } from "@/i18n";
import { LoginModal } from "@/components/Modals/Pages/LoginModal";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale);
	return {
		title: { absolute: t("common.auth.login.metaTitle") },
	};
}

export default async function LoginPage() {
	return <LoginModal routePath="/login" returnTo="/" />;
}
