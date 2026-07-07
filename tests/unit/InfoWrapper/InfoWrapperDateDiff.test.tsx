import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InfoWrapper } from "@/components/InfoWrapper/InfoWrapper";
import type { InfoWrapperConfig } from "@/components/InfoWrapper/types";

vi.mock("react-i18next", () => ({
	useTranslation: (ns?: string) => ({
		t: (key: string) => {
			const normalizedKey = key.replace(/^content\./, "");
			const labels: Record<string, string> = {
				"content:infoWrapper.diffLabel.edited": "edited",
				"content:infoWrapper.diffLabel.addition": "addition",
				"content:infoWrapper.diffLabel.removed": "removed",
			};

			return (
				labels[`${ns ?? "content"}:${normalizedKey}`] ??
				labels[`content:${normalizedKey}`] ??
				normalizedKey
			);
		},
		i18n: { resolvedLanguage: "en" },
	}),
}));

const config: InfoWrapperConfig = {
	fields: [
		{
			id: "rental_contract_end",
			label: "Rental contract end",
			value: "rental_contract_end",
			type: "date",
		},
		{
			id: "established_since",
			label: "Established since",
			value: "established_since",
			type: "year",
		},
	],
};

describe("InfoWrapper date review diffs", () => {
	it("keeps hook order stable when fields appear after rerender", () => {
		const { rerender } = render(
			<InfoWrapper
				data={{}}
				config={{
					fields: [
						{
							id: "name",
							label: "Name",
							value: "name",
							type: "text",
						},
						{
							id: "address",
							label: "Address",
							type: "address",
						},
					],
				}}
			/>,
		);

		rerender(
			<InfoWrapper
				data={{
					name: "Directly loaded submission",
					address: {
						street: "Main Street",
						city: "Berlin",
					},
				}}
				config={{
					fields: [
						{
							id: "name",
							label: "Name",
							value: "name",
							type: "text",
						},
						{
							id: "address",
							label: "Address",
							type: "address",
						},
					],
				}}
			/>,
		);

		expect(
			screen.getAllByText("Directly loaded submission").length,
		).toBeGreaterThan(0);
		expect(screen.getByText("Main Street")).toBeInTheDocument();
	});

	it("renders address fields when only permitted address subfields are present", () => {
		render(
			<InfoWrapper
				data={{
					address: {
						street: "Main Street",
						city: "Berlin",
					},
				}}
				config={{
					fields: [
						{
							id: "address",
							label: "Address",
							type: "address",
						},
					],
				}}
			/>,
		);

		expect(screen.getByText("Main Street")).toBeInTheDocument();
		expect(screen.getByText("Berlin")).toBeInTheDocument();
	});

	it("marks date and year fields as edited when the underlying date changes", () => {
		render(
			<InfoWrapper
				data={{
					rental_contract_end: "2030-01-01",
					established_since: "2008-01-01",
				}}
				newData={{
					rental_contract_end: "2030-12-31",
					established_since: "2008-12-31",
				}}
				config={config}
			/>,
		);

		expect(screen.getAllByText("edited")).toHaveLength(2);
		expect(screen.getByText("Rental contract end:")).toBeInTheDocument();
		expect(screen.getByText("Established since:")).toBeInTheDocument();
	});

	it("marks removed date values in review", () => {
		render(
			<InfoWrapper
				data={{
					rental_contract_end: "2030-01-01",
				}}
				newData={{
					rental_contract_end: "",
				}}
				config={{
					fields: [config.fields[0]],
				}}
			/>,
		);

		expect(screen.getByText("removed")).toBeInTheDocument();
	});

	it("marks added date values in review", () => {
		render(
			<InfoWrapper
				data={{}}
				newData={{
					rental_contract_end: "2030-12-31",
				}}
				config={{
					fields: [config.fields[0]],
				}}
			/>,
		);

		expect(screen.getByText("addition")).toBeInTheDocument();
	});
});
