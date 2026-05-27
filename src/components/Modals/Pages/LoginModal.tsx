"use client";

import { LoginForm } from "@/components/Auth/LoginForm";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
export function LoginModal({
	routePath,
	returnTo,
}: {
	routePath?: string;
	returnTo?: string;
}) {
	const { t } = useTranslation();

	return (
		<Modal
			title={t("common.auth.login.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			returnTo={returnTo}
		>
			<div className="flex flex-1 items-center justify-center md:py-12 md:px-4 w-full">
				<LoginForm />
			</div>
		</Modal>
	);
}
