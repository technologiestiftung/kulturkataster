import type { Metadata } from "next";
import { serverSideTranslation } from "@/i18n";
import { requireAuth } from "@/server/auth/getCurrentUser";
import { userRepo } from "@/server/data/userRepo";
import { AccountEditModal } from "@/components/Modals/Pages/AccountEditModal";

type PageProps = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { locale } = await params;
	const { t } = await serverSideTranslation(locale, ["common"]);
	return {
		title: t("auth.accountEdit.metaTitle"),
	};
}

export default async function AccountEditPage({ params }: PageProps) {
	await params;
	const currentUser = await requireAuth();
	const user = await userRepo.findById(currentUser.id);

	if (!currentUser.email || !user) {
		throw new Error("Authenticated user is missing.");
	}

	return (
		<AccountEditModal
			routePath="/account/edit"
			closeTo="/account"
			userId={user.id}
			email={currentUser.email}
			firstName={user.first_name}
			lastName={user.last_name}
		/>
	);
}
