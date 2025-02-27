import { NextResponse } from "next/server";

export async function GET(_req: Request) {
	// todo: I would like to fetch all maps from services here
	// 1. step fetch sources
	// depending on what sources are there, build layers
	// if some sources are not available, return error

	try {
		// const bbox = process.env.NEXT_PUBLIC_MAP_BOUNDING_BOX;
		// const apiKey = process.env.MAPTILER_API_KEY;
		// const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
		// 	searchQuery,
		// )}.json?key=${apiKey}${bbox ? `&bbox=${bbox}` : ""}`;

		// const response = await fetch(url);
		// const data = await response.json();

		return NextResponse.json({ status: 200 });
	} catch {
		return NextResponse.json(
			{ error: "Error fetching map sources" },
			{ status: 500 },
		);
	}
}
