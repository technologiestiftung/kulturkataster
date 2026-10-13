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
	const { t } = useTranslation();
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
		? t("common.accessibility.title")
		: t("common.institution.details");

	return (
		<div className="flex flex-col h-full">
			<div className="hidden md:flex items-center justify-between gap-3 p-6 shrink-0">
				<div className="flex items-center gap-2 body1 font-bold">
					<button
						onClick={handleBack}
						className="flex items-center gap-1"
						aria-label={t("common.back")}
					>
						<ArrowLeft className="size-6" aria-hidden="true" />{" "}
						{t("common.back")}
					</button>
					<h2 className="body1 font-bold">{title}</h2>
				</div>
				<button onClick={handleBack} aria-label={t("common.closeSidebar")}>
					<Close aria-hidden="true" />
				</button>
			</div>
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
}
