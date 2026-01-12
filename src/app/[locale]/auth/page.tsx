import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { serverSideTranslation } from "@/i18n";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export default async function UserLandingPage({ params }: PageProps) {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale, ["common"]);
	const user = await getCurrentUser();

	if (user) {
		redirect("/account");
	}

	return (
		<div className="flex flex-1 items-center justify-center px-4">
			<div className="w-full max-w-md space-y-6 text-center">
				<div className="space-y-2">
					<h1 className="text-2xl font-bold">{t("auth.account.title")}</h1>
					<p className="text-muted-foreground">{t("auth.account.intro")}</p>
				</div>
				<div className="space-y-3">
					<Button asChild className="w-full">
						<Link href="/user/register">{t("auth.account.signUp")}</Link>
					</Button>
					<Button asChild variant="outline" className="w-full">
						<Link href="/">{t("auth.account.continueGuest")}</Link>
					</Button>
				</div>
				<p className="text-sm text-muted-foreground">
					{t("auth.account.alreadyAccount")}{" "}
					<Link href="/user/login" className="text-primary hover:underline">
						{t("auth.account.signIn")}
					</Link>
				</p>
			</div>
		</div>
	);
}
