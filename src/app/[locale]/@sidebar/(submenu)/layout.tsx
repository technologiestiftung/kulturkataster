"use client";

import ArrowLeft from "@/icons/arrow-narrow-left.svg";
import Close from "@/icons/close.svg";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

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

	const handleClose = () => {
		handleBack();
	};

	const title = pathname?.includes("/accessibilitySettings")
		? t("accessibility.title")
		: t("institution.details");

	return (
		<div className="flex flex-col h-full">
			<div className="gap-3.5 p-2 md:p-6 h-16 shrink-0 md:h-auto shadow-sm md:shadow-none z-10">
				<div className="md:hidden flex justify-center pb-2">
					<div className="w-10 h-1 bg-muted-foreground/90 rounded-full"></div>
				</div>
				<div className="md:flex hidden items-center justify-between w-full">
					<div className="flex items-center gap-2 body1 font-bold ">
						<button
							onClick={handleBack}
							className="flex items-center gap-1"
							aria-label={t("back")}
						>
							<ArrowLeft className="size-6" /> {t("back")}
						</button>
						<span className="">{title}</span>
					</div>
					<button onClick={handleClose} aria-label={t("closeSidebar")}>
						<Close />
					</button>
				</div>
			</div>
			<div className="flex-1 overflow-auto">{children}</div>
		</div>
	);
}
