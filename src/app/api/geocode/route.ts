import { NextResponse } from "next/server";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const searchQuery = searchParams.get("searchQuery");
	if (!searchQuery) {
		return NextResponse.json(
			{ error: "Missing search query" },
			{ status: 400 },
		);
	}

	try {
		const bbox = process.env.NEXT_PUBLIC_MAP_BOUNDING_BOX;
		const apiKey = process.env.MAPTILER_API_KEY;
		const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
			searchQuery,
		)}.json?key=${apiKey}${bbox ? `&bbox=${bbox}` : ""}`;

		const response = await fetch(url);
		const data = await response.json();

		return NextResponse.json(data, {
			status: 200,
			headers: {
				"Cache-Control":
					"no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
				Pragma: "no-cache",
				Expires: "0",
				"Surrogate-Control": "no-store",
			},
		});
	} catch (error) {
		console.error("Geocoding error:", error);
		return NextResponse.json({ error: "Geocoding failed" }, { status: 500 });
	}
}
