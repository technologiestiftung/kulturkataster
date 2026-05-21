"use client";

import ArrowLeft from "@/icons/arrow-narrow-left.svg";
import Close from "@/icons/close.svg";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export default function SubmenuLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { t } = useTranslation("common");
	const router = useRouter();
	const pathname = usePathname();
	const toLocalePath = useLocalePath();

	const handleBack = () => {
		const canGoBack =
			typeof window !== "undefined" &&
			window.history.state?.idx !== undefined &&
			window.history.state.idx > 0;

		if (canGoBack) {
			router.back();
			return;
		}

		router.push(toLocalePath("/map"));
	};

	const title = pathname?.includes("/accessibilitySettings")
		? t("accessibility.title")
		: t("institution.details");

	return (
		<div className="flex flex-col h-full">
			<div className="hidden md:flex items-center justify-between gap-3 p-6 shrink-0">
				<div className="flex items-center gap-2 body1 font-bold">
					<button
						onClick={handleBack}
						className="flex items-center gap-1"
						aria-label={t("back")}
					>
						<ArrowLeft className="size-6" /> {t("back")}
					</button>
					<span>{title}</span>
				</div>
				<button onClick={handleBack} aria-label={t("closeSidebar")}>
					<Close />
				</button>
			</div>
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
}
