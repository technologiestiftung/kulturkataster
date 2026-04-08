"use client";

import { ForgotPasswordForm } from "@/components/Auth/ForgotPasswordForm";
import { Modal } from "@/components/Modals/Modal";
import { useTranslation } from "react-i18next";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

export function ForgotPasswordModal({
	routePath,
	returnTo,
}: {
	routePath?: string;
	returnTo?: string;
}) {
	const { t } = useTranslation("common");
	const closeModal = useRoutedModalClose({ returnTo });

	return (
		<Modal
			title={t("auth.forgot.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			returnTo={returnTo}
			showBackButton={true}
		>
			<div className="flex flex-1 items-center justify-center md:py-12 md:px-4 w-full">
				<ForgotPasswordForm
					onSuccess={() => {
						closeModal();
						showSuccessToast(
							t("auth.forgot.successTitle"),
							t("auth.forgot.successMessage"),
						);
					}}
				/>
			</div>
		</Modal>
	);
}
