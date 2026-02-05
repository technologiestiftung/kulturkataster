"use client";

import { ForgotPasswordForm } from "@/components/Auth/ForgotPasswordForm";
import { Modal } from "@/components/Modals/Modal";
import { useTranslation } from "react-i18next";

export function ForgotPasswordModal({
	routePath,
	returnTo,
}: {
	routePath?: string;
	returnTo?: string;
}) {
	const { t } = useTranslation("common");

	return (
		<Modal
			title={t("auth.forgot.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			returnTo={returnTo}
			content={
				<div className="flex flex-1 items-center justify-center py-12 px-4 w-full">
					<ForgotPasswordForm />
				</div>
			}
		/>
	);
}
