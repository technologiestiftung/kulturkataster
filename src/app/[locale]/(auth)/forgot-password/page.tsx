import Link from "next/link";
import type { Metadata } from "next";
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
		title: t("auth.forgot.metaTitle"),
	};
}

export default async function ForgotPasswordPage({ params }: PageProps) {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale, ["common"]);
	return (
		<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
			<div className="w-full max-w-md space-y-4 text-center">
				<h1>{t("auth.forgot.title")}</h1>
				<p className="text-foreground">{t("auth.forgot.description")}</p>
				<Link href="/login" className="text-primary hover:underline">
					{t("auth.forgot.backToSignIn")}
				</Link>
			</div>
		</div>
	);
}
