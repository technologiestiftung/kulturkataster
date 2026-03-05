"use client";

import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { ResetPasswordForm } from "@/components/Auth/ResetPasswordForm";
import { useRoutedModalClose } from "@/components/Modals/useRoutedModalClose";
import { showSuccessToast } from "@/lib/utils/feedbackToast";

export function ResetPasswordModal({
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
			title={t("auth.reset.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			returnTo={returnTo}
		>
			<div className="flex flex-1 items-center justify-center md:py-12 md:px-4 w-full">
				<ResetPasswordForm
					onSuccess={() => {
						closeModal();
						showSuccessToast(
							t("auth.reset.successTitle", {
								defaultValue: "Password updated",
							}),
							t("auth.reset.successMessage", {
								defaultValue:
									"Your password has been updated successfully. Please sign in.",
							}),
						);
					}}
				/>
			</div>
		</Modal>
	);
}
