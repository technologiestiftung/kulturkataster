"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/appStore";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

export default function MapPage() {
	const router = useRouter();
	const toLocalePath = useLocalePath();

	useEffect(() => {
		const firstTimeUser = useAppStore.getState().firstTimeUser;
		if (firstTimeUser) {
			router.push(toLocalePath("/welcome"));
		}
	}, [router, toLocalePath]);

	return null;
}
