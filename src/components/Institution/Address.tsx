"use client";

import { Institution } from "@/types";
import { useTranslation } from "react-i18next";

interface InstitutionAddressProps {
	institutionData: Institution;
}

export function Address({ institutionData }: InstitutionAddressProps) {
	const { t: tEnum } = useTranslation("enumMap");

	return (
		<address className="not-italic">
			<p className="body1">{institutionData.name}</p>
			{institutionData.address_suffix && (
				<p className="body1">{institutionData.address_suffix}</p>
			)}
			{institutionData.street &&
				institutionData.street_number &&
				institutionData.zip_code && (
					<div className="body1">
						<p>
							{`${institutionData.street.trim()} ${institutionData.street_number.trim()}`}
						</p>
						<div className="flex flex-wrap space-x-1">
							<p>{institutionData.zip_code}</p>
							{institutionData?.city?.name && institutionData.district.key && (
								<p>
									{institutionData.city.name}-
									{tEnum(`berlin_district.${institutionData.district.key}`)}
								</p>
							)}
						</div>
					</div>
				)}
		</address>
	);
}
