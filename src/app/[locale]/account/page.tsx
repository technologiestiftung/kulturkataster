import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { Button } from "@/components/ui/button";
import { serverSideTranslation } from "@/i18n";
import { redirect } from "next/navigation";
import Link from "next/link";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export default async function AccountPage({ params }: PageProps) {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale, ["common"]);
	const user = await getCurrentUser();
	if (!user) {
		redirect("/user");
	}

	return (
		<div className="h-full w-full items-center justify-center px-4">
			<div className="w-full max-w-md space-y-4 text-center">
				<h1 className="text-2xl font-bold">{t("auth.account.title")}</h1>
				<p className="text-muted-foreground">{t("auth.account.comingSoon")}</p>
				<Button asChild className="w-full">
					<Link href="/">{t("auth.account.backToMap")}</Link>
				</Button>
			</div>
		</div>
	);
}
