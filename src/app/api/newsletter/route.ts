// app/api/newsletter/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const { email, name } = body;

		if (!email) {
			return NextResponse.json({ error: "Missing email" }, { status: 400 });
		}

		const clientId = process.env.CLEVERREACH_CLIENT_ID;
		const clientSecret = process.env.CLEVERREACH_CLIENT_SECRET;
		const groupId = process.env.CLEVERREACH_GROUP_ID;
		const formId = process.env.CLEVERREACH_FORM_ID;

		if (!clientId || !clientSecret || !groupId || !formId) {
			return NextResponse.json(
				{ error: "Missing CleverReach env vars" },
				{ status: 500 },
			);
		}

		// 1. GET TOKEN
		const tokenRes = await fetch(
			"https://rest.cleverreach.com/oauth/token.php",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization:
						"Basic " +
						Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
				},
				body: JSON.stringify({
					grant_type: "client_credentials",
				}),
			},
		);

		if (!tokenRes.ok) {
			return NextResponse.json(
				{
					error: "Failed to get CleverReach token",
					details: await tokenRes.text(),
				},
				{ status: tokenRes.status },
			);
		}

		const tokenData = await tokenRes.json();
		const accessToken = tokenData.access_token;

		// 2. CREATE RECEIVER
		const receiverRes = await fetch(
			`https://rest.cleverreach.com/v3/groups.json/${groupId}/receivers`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					email,
					registered: Math.floor(Date.now() / 1000),
					activated: 0,
					source: "website",
					global_attributes: {
						name,
					},
				}),
			},
		);

		if (!receiverRes.ok) {
			return NextResponse.json(
				{
					error: "Failed to create receiver",
					details: await receiverRes.text(),
				},
				{ status: receiverRes.status },
			);
		}

		// 3. SEND DOUBLE OPT-IN
		const doiRes = await fetch(
			`https://rest.cleverreach.com/v3/forms.json/${formId}/send/activate`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					email,
					doidata: {
						user_ip: req.headers.get("x-forwarded-for") ?? "unknown",
						referer: req.headers.get("referer") ?? "",
						user_agent: req.headers.get("user-agent") ?? "",
					},
				}),
			},
		);

		if (!doiRes.ok) {
			return NextResponse.json(
				{
					error: "Failed to send DOI mail",
					details: await doiRes.text(),
				},
				{ status: doiRes.status },
			);
		}

		return NextResponse.json({
			success: true,
		});
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{
				error: "Internal server error",
			},
			{ status: 500 },
		);
	}
}
