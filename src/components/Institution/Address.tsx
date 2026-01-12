"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";

interface InstitutionAddressProps {
	institution: Institution;
}

export function Address({ institution }: InstitutionAddressProps) {
	const { t: tEnum } = useTranslation("enumMap");
	const cityName = institution.address?.city;
	const districtKey = institution.address?.district;

	return (
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
							{cityName && districtKey && (
								<p>
									{cityName}-{tEnum(`${districtKey}`)}
								</p>
							)}
						</div>
					</div>
				)}
		</address>
	);
}
