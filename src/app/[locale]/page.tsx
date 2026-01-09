"use client";

import ListView from "@/components/ListView/ListView";
import { useAppStore } from "@/lib/store/appStore";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Home() {
	const { t } = useTranslation("common");
	const viewMode = useAppStore((state) => state.viewMode);

	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		const firstTimeUser = useAppStore.getState().firstTimeUser;
		if (firstTimeUser) {
			const isHome = pathname === "/";
			if (isHome) {
				router.push("/welcome");
			}
		}
	}, []);

	return (
		<>
			{viewMode === "list" && (
				<div className="items-center flex-1 justify-items-center h-full relative w-full">
					<section className="h-full w-full" aria-label={t("listView.title")}>
						<ListView />
					</section>
				</div>
			)}
		</>
	);
}
