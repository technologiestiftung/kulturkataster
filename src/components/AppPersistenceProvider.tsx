"use client";

import { useAppStore } from "@/lib/store/appStore";
import { useEffect, useState } from "react";

export function AppPersistenceProvider() {
	const { isContrastMode, setIsContrastMode, baseFontSize, setBaseFontSize } =
		useAppStore();
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
			setBaseFontSize(baseFontSize);
		}
	}, [
		hasHydrated,
		isContrastMode,
		setIsContrastMode,
		baseFontSize,
		setBaseFontSize,
	]);

	return null;
}
