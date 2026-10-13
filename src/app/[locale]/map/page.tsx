"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/appStore";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useTranslation } from "react-i18next";

export default function MapPage() {
	const { t } = useTranslation();
	const router = useRouter();
	const toLocalePath = useLocalePath();

	useEffect(() => {
		const firstTimeUser = useAppStore.getState().firstTimeUser;
		if (firstTimeUser) {
			router.push(toLocalePath("/welcome"));
		}
	}, [router, toLocalePath]);

	// The map itself renders outside this page (MapListShell); this gives the
	// view its own page heading.
	return <h1 className="sr-only">{t("common.map.title")}</h1>;
}
