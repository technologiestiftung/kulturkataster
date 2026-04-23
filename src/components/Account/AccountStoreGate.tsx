"use client";

import type { ReactNode } from "react";
import { useAccountStore } from "@/lib/store/accountStore";

export function AccountStoreGate({
	children,
	fallback = null,
}: {
	children: ReactNode;
	fallback?: ReactNode;
}) {
	const isInitialized = useAccountStore((state) => state.isInitialized);
	if (!isInitialized) {
		return <>{fallback}</>;
	}
	return <>{children}</>;
}
