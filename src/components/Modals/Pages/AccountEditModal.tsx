"use client";

import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { AccountEditForm } from "@/components/Account/AccountEditForm";

type AccountEditModalProps = {
	routePath?: string;
	returnTo?: string;
	userId: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
};

export function AccountEditModal({
	routePath,
	returnTo,
	userId,
	email,
	firstName,
	lastName,
}: AccountEditModalProps) {
	const { t } = useTranslation("common");

	return (
		<Modal
			title={t("auth.accountEdit.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			returnTo={returnTo}
			content={
				<div className="flex flex-1 items-center justify-center py-12 px-4 w-full">
					<AccountEditForm
						userId={userId}
						email={email}
						firstName={firstName}
						lastName={lastName}
					/>
				</div>
			}
		/>
	);
}
