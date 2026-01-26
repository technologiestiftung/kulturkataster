"use client";

import { LoginForm } from "@/components/Auth/LoginForm";
import { useTranslation } from "react-i18next";
import { Modal } from "@/components/Modals/Modal";
import { usePathname } from "next/navigation";

export function LoginModal({ isModal = false }: { isModal?: boolean }) {
	const { t } = useTranslation("common");
	const pathname = usePathname();
	const isActiveRoute = pathname?.endsWith("/login") ?? false;
	const closeTo = !isModal ? "/" : undefined;

	if (!isActiveRoute) {
		return null;
	}

	return (
		<Modal
			title={t("auth.login.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			open={isActiveRoute}
			closeTo={closeTo}
			content={
				<div className="flex flex-1 items-center justify-center py-12 px-4 w-full">
					<LoginForm />
				</div>
			}
		/>
	);
}
