import { beforeEach, describe, expect, it, vi } from "vitest";

const { headersMock, loggerError, fetchMock } = vi.hoisted(() => ({
	headersMock: vi.fn(),
	loggerError: vi.fn(),
	fetchMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
	headers: headersMock,
}));

vi.mock("@/server/logging/logger", () => ({
	logger: {
		error: loggerError,
	},
}));

global.fetch = fetchMock as unknown as typeof fetch;

import { subscribeToNewsletter } from "@/server/actions/newsletter";

describe("server actions: newsletter", () => {
	beforeEach(() => {
		fetchMock.mockReset();
		headersMock.mockReset();
		loggerError.mockReset();

		process.env.CLEVERREACH_CLIENT_ID = "client-id";
		process.env.CLEVERREACH_CLIENT_SECRET = "client-secret";
		process.env.CLEVERREACH_GROUP_ID = "group-id";
		process.env.CLEVERREACH_FORM_ID = "form-id";

		headersMock.mockResolvedValue({
			get: (key: string) =>
				(
					({
						"x-forwarded-for": "203.0.113.5, 10.0.0.1",
						referer: "https://example.test/newsletter",
						"user-agent": "Vitest Agent",
					}) as Record<string, string>
				)[key] ?? null,
		});
	});

	it("subscribes a receiver and sends the DOI mail", async () => {
		fetchMock
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ access_token: "token-123" }), {
					status: 200,
				}),
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ id: "receiver-1" }), { status: 200 }),
			)
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ ok: true }), { status: 200 }),
			);

		const result = await subscribeToNewsletter({
			email: "person@example.com",
			name: "Ada Lovelace",
		});

		expect(result).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock.mock.calls[1]?.[0]).toBe(
			"https://rest.cleverreach.com/v3/groups.json/group-id/receivers",
		);
		expect(fetchMock.mock.calls[2]?.[0]).toBe(
			"https://rest.cleverreach.com/v3/forms.json/form-id/send/activate",
		);

		const receiverBody = JSON.parse(
			String((fetchMock.mock.calls[1]?.[1] as { body?: unknown })?.body),
		);
		expect(receiverBody).toMatchObject({
			email: "person@example.com",
			source: "website",
			global_attributes: {
				name: "Ada Lovelace",
			},
		});

		const doiBody = JSON.parse(
			String((fetchMock.mock.calls[2]?.[1] as { body?: unknown })?.body),
		);
		expect(doiBody).toEqual({
			email: "person@example.com",
			doidata: {
				user_ip: "203.0.113.5",
				referer: "https://example.test/newsletter",
				user_agent: "Vitest Agent",
			},
		});
	});

	it("returns a structured failure when the receiver creation fails", async () => {
		fetchMock
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ access_token: "token-123" }), {
					status: 200,
				}),
			)
			.mockResolvedValueOnce(new Response("bad receiver", { status: 400 }));

		const result = await subscribeToNewsletter({
			email: "person@example.com",
		});

		expect(result).toEqual({ ok: false, error: "receiver_failed" });
		expect(loggerError).toHaveBeenCalledWith(
			"newsletter.subscribe.receiver_failed",
			undefined,
			expect.objectContaining({
				subsystem: "newsletter",
				http_status: 400,
			}),
		);
	});
});
