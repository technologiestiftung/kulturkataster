import { Button } from "@/components/ui/button";
import { serverSideTranslation } from "@/i18n";
import Link from "next/link";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export default async function AccountPage({ params }: PageProps) {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale, ["common"]);

	return (
		<div className="h-full w-full items-center justify-center px-4">
			<div className="w-full max-w-md space-y-4 text-center">
				<h1>{t("auth.account.title")}</h1>
				<p className="text-foreground">{t("auth.account.comingSoon")}</p>
				<Button asChild className="w-full">
					<Link href="/">{t("auth.account.backToMap")}</Link>
				</Button>
			</div>
		</div>
	);
}
