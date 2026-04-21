"use client";

import { use, type ReactNode } from "react";
import { useAccountStore } from "@/lib/store/accountStore";

// Lazily created on first render so the store isn't accessed at module-load
// time (which would break test mocks). Stays resolved for the lifetime of
// the app, so subsequent navigations back to the account section skip the
// skeleton entirely.
let readyPromise: Promise<void> | null = null;

function getReadyPromise(): Promise<void> {
	if (!readyPromise) {
		readyPromise = new Promise<void>((resolve) => {
			if (useAccountStore.getState().isInitialized) {
				resolve();
				return;
			}
			const unsubscribe = useAccountStore.subscribe((state) => {
				if (state.isInitialized) {
					resolve();
					unsubscribe();
				}
			});
		});
	}
	return readyPromise;
}

export function AccountStoreGate({ children }: { children: ReactNode }) {
	use(getReadyPromise());
	return <>{children}</>;
}
