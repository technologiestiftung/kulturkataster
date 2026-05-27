import type { Metadata } from "next";
import { serverSideTranslation } from "@/i18n";
import { ForgotPasswordModal } from "@/components/Modals/Pages/ForgotPasswordModal";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale);
	return {
		title: t("common.auth.forgot.metaTitle"),
	};
}

export default async function ForgotPasswordPage({ params }: PageProps) {
	await params;
	return <ForgotPasswordModal routePath="/forgotPassword" returnTo="/login" />;
}
