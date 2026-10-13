import type { Metadata } from "next";
import { ResetPasswordModal } from "@/components/Modals/Pages/ResetPasswordModal";
import { serverSideTranslation } from "@/i18n";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale);
	return {
		title: { absolute: t("common.auth.reset.metaTitle") },
	};
}

export default async function ResetPasswordPage() {
	return <ResetPasswordModal routePath="/resetPassword" returnTo="/" />;
}
