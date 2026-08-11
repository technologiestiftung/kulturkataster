"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LocationSearch } from "@/components/Search/LocationSearch";
import { SelectableOptionsList } from "@/components/MultiSelect/SelectableOptionsList";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { searchInstitutions } from "@/server/actions/institutions";
import type { Institution } from "@/types/institution";

export function QuestionnaireInstitutionLinkStep({
	isRegistered,
	institutionId,
	onChange,
	onBack,
	onNext,
}: {
	isRegistered: boolean | null;
	institutionId: number | null;
	onChange: (patch: {
		isRegistered?: boolean | null;
		institutionId?: number | null;
	}) => void;
	onBack: () => void;
	onNext: () => void;
}) {
	const { t } = useTranslation();
	const toLocalePath = useLocalePath();
	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Institution[]>([]);

	useEffect(() => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}
		let active = true;
		const handle = setTimeout(() => {
			void searchInstitutions(query)
				.then((results) => {
					if (active) setSearchResults(results as Institution[]);
				})
				.catch(() => {
					if (active) setSearchResults([]);
				});
		}, 300);
		return () => {
			active = false;
			clearTimeout(handle);
		};
	}, [query]);

	const selectedInstitution = useMemo(
		() => searchResults.find((institution) => institution.id === institutionId),
		[searchResults, institutionId],
	);

	const options = useMemo(
		() =>
			searchResults.map((institution) => ({
				value: String(institution.id),
				label: institution.name,
			})),
		[searchResults],
	);

	const handleSelect = useCallback(
		(value: string) => {
			onChange({ institutionId: Number(value) });
		},
		[onChange],
	);

	const canProceed = isRegistered === true && institutionId !== null;
	let radioValue = "";
	if (isRegistered === true) radioValue = "yes";
	else if (isRegistered === false) radioValue = "no";

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<h1 className="font-bold">
					{t("content.questionnaireWizard.institutionLink.title", {
						defaultValue: "Allgemeine Angaben zum Kulturort",
					})}
				</h1>
				<p className="body2">
					{t("content.questionnaireWizard.institutionLink.description", {
						defaultValue:
							"Helfen Sie uns, die Berliner Kulturlandschaft zu stärken und ergänzen Sie hier die Daten eines bestehenden Kulturorts für den Sie zuständig sind.\nWenn Sie nicht bereits eingeloggt sind, können Sie dies am Ende der Befragung tun oder sich dann noch registrieren, um Ihre Angaben zu speichern.",
					})}
				</p>
			</div>

			<Card variant="secondary" className="space-y-4">
				<Label className="text-neutral-80">
					{t("content.questionnaireWizard.institutionLink.question", {
						defaultValue: "Ist der Kulturort bereits im Kulturkataster erfasst?",
					})}
				</Label>
				<RadioGroup
					value={radioValue}
					onValueChange={(value) =>
						onChange({
							isRegistered: value === "yes",
							institutionId: value === "yes" ? institutionId : null,
						})
					}
				>
					<div className="flex items-start space-x-2">
						<RadioGroupItem
							value="yes"
							id="institution-link-yes"
							className="bg-background border-input"
						/>
						<Label htmlFor="institution-link-yes" emphasize={false}>
							{t("common.yes", { defaultValue: "Ja" })}
						</Label>
					</div>
					<div className="flex items-start space-x-2">
						<RadioGroupItem
							value="no"
							id="institution-link-no"
							className="bg-background border-input"
						/>
						<Label htmlFor="institution-link-no" emphasize={false}>
							{t("common.no", { defaultValue: "Nein" })}
						</Label>
					</div>
				</RadioGroup>

				{isRegistered === true && (
					<div className="space-y-2 rounded-sm bg-neutral-10 p-4">
						<Label className="text-neutral-80">
							{t("content.questionnaireWizard.institutionLink.searchLabel", {
								defaultValue: "Name des Kulturortes",
							})}
						</Label>
						{selectedInstitution ? (
							<div className="flex items-center justify-between rounded-full bg-background px-4 py-2 body2">
								<span>{selectedInstitution.name}</span>
								<button
									type="button"
									className="text-primary-dark underline"
									onClick={() => onChange({ institutionId: null })}
								>
									{t("common.change", { defaultValue: "Ändern" })}
								</button>
							</div>
						) : (
							<>
								<LocationSearch
									onQueryChange={setQuery}
									showResults={false}
									searchFunction={async () => []}
									placeholder={t(
										"content.questionnaireWizard.institutionLink.searchPlaceholder",
										{ defaultValue: "Adresse oder Ort eingeben" },
									)}
								/>
								{options.length > 0 && (
									<SelectableOptionsList
										options={options}
										selectedValues={
											institutionId ? [String(institutionId)] : []
										}
										multiSelect={false}
										variant="panel"
										showCheckbox={true}
										emptyText={t(
											"content.questionnaireWizard.institutionLink.searchEmpty",
											{ defaultValue: "Keine Kulturorte gefunden." },
										)}
										onToggle={handleSelect}
									/>
								)}
							</>
						)}
					</div>
				)}

				{isRegistered === false && (
					<p className="body2 rounded-sm bg-neutral-10 p-4">
						{t("content.questionnaireWizard.institutionLink.notRegistered", {
							defaultValue:
								"Bitte erfassen Sie den Kulturort zunächst über die Einreichung eines Kulturortes, bevor Sie die Befragung zu diesem Ort ausfüllen können.",
						})}{" "}
						<Link
							href={toLocalePath("/institution")}
							className="text-primary-dark underline"
						>
							{t(
								"content.questionnaireWizard.institutionLink.notRegisteredCta",
								{ defaultValue: "Kulturort einreichen" },
							)}
						</Link>
					</p>
				)}
			</Card>

			<div className="flex flex-col-reverse gap-4 md:flex-row md:justify-end">
				<Button type="button" variant="outline" fullWidth onClick={onBack}>
					{t("common.back", { defaultValue: "Zurück" })}
				</Button>
				<Button type="button" fullWidth disabled={!canProceed} onClick={onNext}>
					{t("common.next", { defaultValue: "Weiter" })}
				</Button>
			</div>
		</div>
	);
}
