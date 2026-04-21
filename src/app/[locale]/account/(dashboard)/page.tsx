"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

export default function AccountPage() {
	const router = useRouter();
	const toLocalePath = useLocalePath();

	useEffect(() => {
		router.replace(toLocalePath("/account/activity"));
	}, [router, toLocalePath]);

	return null;
}
