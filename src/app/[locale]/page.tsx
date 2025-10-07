"use client";

import ListView from "@/components/ListView/ListView";
import Map from "@/components/Map/Map";
import { useAppStore } from "@/lib/store/appStore";

export default function Home() {
	const viewMode = useAppStore((state) => state.viewMode);

	return (
		<div className="items-center flex-1 justify-items-center h-full relative w-full">
			{viewMode === "map" ? <Map /> : <ListView />}
		</div>
	);
}
