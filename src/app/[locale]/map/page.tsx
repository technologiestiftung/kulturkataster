"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store/appStore";

export default function MapPage() {
	const router = useRouter();

	useEffect(() => {
		const firstTimeUser = useAppStore.getState().firstTimeUser;
		if (firstTimeUser) {
			router.push("/welcome");
		}
	}, [router]);

	return null;
}
