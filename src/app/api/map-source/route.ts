import { NextResponse } from "next/server";

export async function GET(_req: Request) {
	// todo: I would like to fetch all maps from services here

	try {
		return NextResponse.json({ status: 200 });
	} catch {
		return NextResponse.json(
			{ error: "Error fetching map sources" },
			{ status: 500 },
		);
	}
}
