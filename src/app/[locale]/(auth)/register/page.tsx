import type { Metadata } from "next";
import { serverSideTranslation } from "@/i18n";
import { RegisterModal } from "@/components/Modals/Pages/RegisterModal";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale);
	return {
		title: { absolute: t("common.auth.register.metaTitle") },
	};
}

export default async function RegisterPage() {
	return <RegisterModal routePath="/register" returnTo="/" />;
}
