import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/Auth/ResetPasswordForm";
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
		title: t("auth.reset.metaTitle"),
	};
}

export default async function ResetPasswordPage() {
	return (
		<div className="flex flex-1 items-center justify-center py-12 px-4 w-full">
			<ResetPasswordForm />
		</div>
	);
}
