"use client";

import { useTranslation } from "react-i18next";
import KukaLargeLogo from "@/logos/kuka-large.svg";
import TechnologieStiftungLogo from "@/logos/technologiestiftung.svg";
import SenateLogo from "@/logos/senate.svg";
import KRBLogo from "@/logos/KRB.svg";

export function ModalFooter() {
	const { t } = useTranslation("common");

	return (
		<>
			<div className="ModalFooter-root flex justify-center w-full h-auto bg-secondary px-6 py-12 ">
				<div className="w-full flex items-center justify-between">
					<div className="w-5/11 flex items-center justify-center">
						<KukaLargeLogo className="h-auto w-36" />
					</div>
					<div className="w-6/11 flex justify-center flex-col text-left">
						<h2>{t("footer.title")}</h2>
						<div className="body2 flex flex-col">
							<span>{t("footer.address.suffix")}</span>
							<span>{t("footer.address.street")}</span>
							<div className="flex space-x-2">
								<span>{t("footer.address.zip")}</span>
								<span>{t("footer.address.city")}</span>
							</div>
							<div className="flex space-x-2">
								<span>{t("footer.telephone.label")}</span>
								<span className="underline">
									{t("footer.telephone.number")}
								</span>
							</div>
							<div className="flex space-x-2">
								<span>{t("footer.email.label")}</span>
								<span className="underline">{t("footer.email.address")}</span>
							</div>
							<div className="flex space-x-2 mt-16 font-bold">
								<a className="">{t("footer.about")}</a>
								<a className="">{t("footer.newsletter")}</a>
								<a className="">{t("footer.imprint")}</a>
								<a className="">{t("footer.privacy")}</a>
								<a className="">{t("footer.accessibility")}</a>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div className="mt-4 mb-10 p-6  md:px-40 flex items-center justify-center space-x-4">
				<span className="text-xs self-center">{t("footer.credit.text")}</span>
				<KRBLogo className="w-22 h-auto" />
				<TechnologieStiftungLogo className="w-48 h-auto" />
				<SenateLogo className="w-36 h-auto" />
			</div>
		</>
	);
}
