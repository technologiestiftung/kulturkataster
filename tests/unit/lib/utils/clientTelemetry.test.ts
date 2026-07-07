import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportClientTelemetry } from "@/lib/utils/clientTelemetry";
import { logClientTelemetry } from "@/server/actions/clientTelemetry";

vi.mock("@/server/actions/clientTelemetry", () => ({
	logClientTelemetry: vi.fn().mockResolvedValue(undefined),
}));

const mockedLogClientTelemetry = vi.mocked(logClientTelemetry);

describe("reportClientTelemetry", () => {
	beforeEach(() => {
		mockedLogClientTelemetry.mockReset();
		mockedLogClientTelemetry.mockResolvedValue(undefined);
		window.history.replaceState({}, "", "/de/account/submissions/166");
	});

	it("serializes Error-like boundary objects without wrapping them as non-errors", async () => {
		reportClientTelemetry({
			level: "error",
			event: "react.render_error",
			error: {
				name: "Error",
				message: "Minified React error #300",
				stack: "Error: Minified React error #300\n    at Component",
			},
		});

		await vi.waitFor(() => {
			expect(mockedLogClientTelemetry).toHaveBeenCalledTimes(1);
		});

		expect(mockedLogClientTelemetry).toHaveBeenCalledWith(
			expect.objectContaining({
				error: {
					name: "Error",
					message: "Minified React error #300",
					stack: "Error: Minified React error #300\n    at Component",
				},
			}),
		);
	});

	it("keeps non-error objects marked with details", async () => {
		reportClientTelemetry({
			level: "error",
			event: "react.render_error",
			error: { reason: "unknown" },
		});

		await vi.waitFor(() => {
			expect(mockedLogClientTelemetry).toHaveBeenCalledTimes(1);
		});

		expect(mockedLogClientTelemetry).toHaveBeenCalledWith(
			expect.objectContaining({
				error: {
					message: "Non-Error object thrown",
					details: { reason: "unknown" },
				},
			}),
		);
	});

	it("adds the current browser pathname to metadata", async () => {
		reportClientTelemetry({
			level: "warn",
			event: "client.event",
			metadata: { subsystem: "client_ui" },
		});

		await vi.waitFor(() => {
			expect(mockedLogClientTelemetry).toHaveBeenCalledTimes(1);
		});

		expect(mockedLogClientTelemetry).toHaveBeenCalledWith(
			expect.objectContaining({
				metadata: expect.objectContaining({
					subsystem: "client_ui",
					client_pathname: "/de/account/submissions/166",
				}),
			}),
		);
	});
});
