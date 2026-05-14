"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";
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
	const { t: tEnum } = useTranslation("enumMap");
	const cityName = institution.address?.city;
	const districtKey = institution.address?.district;
	const neighbourhood = institution.address?.neighbourhood;

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
				<p className="body1">{institution.name}</p>
				{institution.address?.address_suffix && (
					<p className="body1">{institution.address.address_suffix}</p>
				)}
				{institution.address?.street &&
					institution.address.street_number &&
					institution.address.zipcode && (
						<div className="body1">
							<p>
								{`${institution.address.street.trim()} ${institution.address.street_number.trim()}`}
							</p>
							<div className="flex flex-wrap space-x-1">
								<p>{institution.address.zipcode}</p>
								{neighbourhood && <p>{neighbourhood},</p>}
								{cityName && districtKey && (
									<p>
										{cityName}-{tEnum(`${districtKey}`)}
									</p>
								)}
							</div>
						</div>
					)}
			</address>
			<div>{isPrivate ? <PrivateBadge /> : null}</div>
		</div>
	);
}
