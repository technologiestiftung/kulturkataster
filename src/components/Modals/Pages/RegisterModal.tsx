"use client";

import { RegisterForm } from "@/components/Auth/RegisterForm";
import { Modal } from "@/components/Modals/Modal";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";

export function RegisterModal({ isModal = false }: { isModal?: boolean }) {
	const { t } = useTranslation("common");
	const pathname = usePathname();
	const isActiveRoute = pathname?.endsWith("/register") ?? false;
	const closeTo = !isModal ? "/" : undefined;

	if (!isActiveRoute) {
		return null;
	}

	return (
		<Modal
			title={t("auth.register.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			containerClassName="p-0 md:p-0 mt-0 md:mt-0"
			contentWrapperClassName="flex-1"
			contentClassName=""
			open={isActiveRoute}
			closeTo={closeTo}
			content={
				<div className="w-full flex flex-1 items-center justify-center py-12 px-4">
					<RegisterForm />
				</div>
			}
		/>
	);
}
