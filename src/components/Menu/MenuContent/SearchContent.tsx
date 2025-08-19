"use client";

import { LocationSearch } from "@/components/Search/LocationSearch";

export function SearchContent() {
	return (
		<div className="min-h-full w-full p-6 bg-secondary">
			<LocationSearch />
		</div>
	);
}
