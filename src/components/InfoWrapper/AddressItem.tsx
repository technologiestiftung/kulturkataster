"use client";

import { Institution } from "@/types";
import { PrivateBadge } from "../shared/PrivateBadge";

interface InstitutionAddressProps {
	institution: Partial<Institution>;
	label?: string;
	description?: string;
	isPrivate?: boolean;
	action?: React.ReactNode;
}

export function AddressItem({
	institution,
	label,
	description,
	isPrivate = false,
	action,
}: InstitutionAddressProps) {
	const cityName = institution.address?.city;
	const districtKey = institution.address?.district;
	const neighbourhood = institution.address?.neighbourhood;
	const streetLine = [
		institution.address?.street,
		institution.address?.street_number,
	]
		.map((part) => (typeof part === "string" ? part.trim() : ""))
		.filter(Boolean)
		.join(" ");
	const cityLineParts = [
		institution.address?.zipcode,
		neighbourhood ? `${neighbourhood},` : undefined,
		cityName && districtKey
			? `${cityName}-${districtKey}`
			: (cityName ?? districtKey),
	].filter((part): part is string => Boolean(part));

	return (
		<div className="flex flex-col gap-2">
			{label && (
				<div className="flex items-start justify-between gap-3">
					<p className="body2">
						<strong>{label}:</strong>
					</p>
					<div className="flex items-center gap-2">{action}</div>
				</div>
			)}
			{description && <p className="body2 text-neutral-80">{description}</p>}
			<address className="not-italic">
				{institution.name && <p className="body1">{institution.name}</p>}
				{institution.address?.address_suffix && (
					<p className="body1">{institution.address.address_suffix}</p>
				)}
				{streetLine && <p className="body1">{streetLine}</p>}
				{cityLineParts.length > 0 && (
					<div className="body1 flex flex-wrap space-x-1">
						{cityLineParts.map((part) => (
							<p key={part}>{part}</p>
						))}
					</div>
				)}
			</address>
			<div>{isPrivate ? <PrivateBadge /> : null}</div>
		</div>
	);
}
