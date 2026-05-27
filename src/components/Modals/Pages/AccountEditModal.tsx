"use client";

import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { AccountEditForm } from "@/components/Account/AccountEditForm";
import { showSuccessToast } from "@/lib/utils/feedbackToast";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";

type AccountEditModalProps = {
	routePath?: string;
	returnTo?: string;
	userId: string;
	email: string | null;
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
	const { t } = useTranslation();
	const handleClose = useRoutedModalClose({ returnTo });

	return (
		<Modal
			title={t("common.auth.accountEdit.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			returnTo={returnTo}
		>
			<div className="flex flex-1 items-center justify-center md:py-12 md:px-4 w-full">
				<AccountEditForm
					userId={userId}
					email={email}
					firstName={firstName}
					lastName={lastName}
					onCancel={handleClose}
					onSuccess={() => {
						handleClose();
						showSuccessToast(
							t("common.auth.accountEdit.successTitle"),
							t("common.auth.accountEdit.successDescription"),
						);
					}}
				/>
			</div>
		</Modal>
	);
}
