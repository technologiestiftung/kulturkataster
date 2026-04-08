"use client";

import { useAppStore } from "@/lib/store/appStore";
import { useEffect, useState } from "react";

export function AppPersistenceProvider() {
	const {
		isContrastMode,
		setIsContrastMode,
		isLargeTextMode,
		isReducedMotion,
		setIsReducedMotion,
	} = useAppStore();
	const [hasHydrated, setHasHydrated] = useState(false);

	useEffect(() => {
		const unsubFinishHydration = useAppStore.persist.onFinishHydration(() => {
			setHasHydrated(true);
		});

		// Check if already hydrated
		if (useAppStore.persist.hasHydrated()) {
			setHasHydrated(true);
		}

		return unsubFinishHydration;
	}, []);

	useEffect(() => {
		if (hasHydrated) {
			setIsContrastMode(isContrastMode);
			setIsReducedMotion(isReducedMotion);
			if (isLargeTextMode) {
				document.documentElement.style.fontSize = "112.5%";
			}
		}
	}, [
		hasHydrated,
		isContrastMode,
		setIsContrastMode,
		isLargeTextMode,
		isReducedMotion,
		setIsReducedMotion,
	]);

	return null;
}
