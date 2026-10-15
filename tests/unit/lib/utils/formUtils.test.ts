import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import {
	buildInstitutionAddressPayload,
	handleAddressBlur,
} from "@/lib/utils/formUtils";

describe("formUtils", () => {
	it("preserves district when building an institution address payload", () => {
		const payload = buildInstitutionAddressPayload({
			"address.streetLine": "Skalitzer Str. 10",
			"address.city": "Berlin",
			"address.zip": "10999",
			"address.district": "Friedrichshain-Kreuzberg",
			"address.address_suffix": "Haus A",
			"address.neighbourhood": "Kreuzberg",
			"address.cultural_area": "Sued",
			"address.lat": "52.4986",
			"address.lng": "13.4314",
		});

		expect(payload).toMatchObject({
			street: "Skalitzer Str.",
			street_number: "10",
			city: "Berlin",
			zipcode: "10999",
			district: "Friedrichshain-Kreuzberg",
			address_suffix: "Haus A",
			neighbourhood: "Kreuzberg",
			cultural_area: "Sued",
			lat: 52.4986,
			lng: 13.4314,
		});
	});
});

describe("handleAddressBlur", () => {
	const savedAddress = {
		"address.streetLine": "Skalitzer Str. 10",
		"address.zip": "10999",
		"address.city": "Berlin",
	};

	const renderBlur = (initialFormData?: Record<string, unknown>) => {
		const geocode = vi.fn().mockResolvedValue({ lat: 52.5, lng: 13.4 });
		const { result } = renderHook(() =>
			handleAddressBlur(useRef({ lastQuery: "", inflight: false }), geocode, {
				initialFormData,
			}),
		);
		return { blur: result.current, geocode };
	};

	it("keeps saved coordinates when the address was not changed", async () => {
		const initial = {
			...savedAddress,
			"address.lat": 52.1,
			"address.lng": 13.1,
		};
		const { blur, geocode } = renderBlur(initial);
		const updateField = vi.fn();

		await blur(undefined, initial, updateField);

		expect(geocode).not.toHaveBeenCalled();
		expect(updateField).not.toHaveBeenCalled();
	});

	it("geocodes once the saved address is edited", async () => {
		const initial = {
			...savedAddress,
			"address.lat": 52.1,
			"address.lng": 13.1,
		};
		const { blur, geocode } = renderBlur(initial);
		const updateField = vi.fn();

		await blur(
			undefined,
			{ ...initial, "address.streetLine": "Skalitzer Str. 12" },
			updateField,
		);

		expect(geocode).toHaveBeenCalledWith("Skalitzer Str. 12, 10999, Berlin");
		expect(updateField).toHaveBeenCalledWith("address.lat", 52.5);
		expect(updateField).toHaveBeenCalledWith("address.lng", 13.4);
	});

	it("geocodes a saved address that has no coordinates yet", async () => {
		const { blur, geocode } = renderBlur(savedAddress);

		await blur(undefined, savedAddress, vi.fn());

		expect(geocode).toHaveBeenCalledWith("Skalitzer Str. 10, 10999, Berlin");
	});
});
