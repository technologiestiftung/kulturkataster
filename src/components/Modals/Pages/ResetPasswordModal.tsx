"use client";

import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { ResetPasswordForm } from "@/components/Auth/ResetPasswordForm";

export function ResetPasswordModal({
	routePath,
	closeTo,
}: {
	routePath?: string;
	closeTo?: string;
}) {
	const { t } = useTranslation("common");

	return (
		<Modal
			title={t("auth.reset.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			closeTo={closeTo}
			content={
				<div className="flex flex-1 items-center justify-center py-12 px-4 w-full">
					<ResetPasswordForm />
				</div>
			}
		/>
	);
}
