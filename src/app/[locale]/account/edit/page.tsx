import type { Metadata } from "next";
import { serverSideTranslation } from "@/i18n";
import { userRepo } from "@/server/data/userRepo";
import { AccountEditModal } from "@/components/Modals/Pages/AccountEditModal";
import { getCurrentUser } from "@/server/actions/auth";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale);
	return {
		title: t("common.auth.accountEdit.metaTitle"),
	};
}

export default async function AccountEditPage({ params }: PageProps) {
	await params;
	const user = await getCurrentUser();
	if (!user) {
		return null;
	}
	const userProfile = await userRepo.findById(user.id);

	return (
		<AccountEditModal
			routePath="/account/edit"
			returnTo="/account"
			userId={user?.id}
			email={user?.email ?? null}
			firstName={userProfile?.first_name}
			lastName={userProfile?.last_name}
		/>
	);
}
