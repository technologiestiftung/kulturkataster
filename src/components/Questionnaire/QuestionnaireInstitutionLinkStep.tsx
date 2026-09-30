"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LocationSearch } from "@/components/Search/LocationSearch";
import { SelectableOptionsList } from "@/components/MultiSelect/SelectableOptionsList";
import { QuestionnaireInstitutionCreateForm } from "@/components/Questionnaire/QuestionnaireInstitutionCreateForm";
import { searchInstitutions } from "@/server/actions/institutions";
import { checkQuestionnaireCompletion } from "@/server/actions/questionnaires";
import type { Institution } from "@/types/institution";
import type { Category } from "@/types";

export function QuestionnaireInstitutionLinkStep({
	questionnaireId,
	isInstitutionRegistered,
	institutionId,
	pendingInstitutionData,
	categoryGroups,
	onChange,
	onBack,
	onNext,
}: {
	questionnaireId: number;
	isInstitutionRegistered: boolean | null;
	institutionId: number | null;
	pendingInstitutionData: Record<string, unknown> | null;
	categoryGroups: Category[];
	onChange: (patch: {
		isInstitutionRegistered?: boolean | null;
		institutionId?: number | null;
		submissionId?: number | null;
		pendingInstitutionData?: Record<string, unknown> | null;
	}) => void;
	onBack: () => void;
	onNext: () => void;
}) {
	const { t } = useTranslation();
	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Institution[]>([]);
	const [alreadySubmitted, setAlreadySubmitted] = useState(false);

	useEffect(() => {
		if (institutionId === null) {
			setAlreadySubmitted(false);
			return;
		}
		let active = true;
		void checkQuestionnaireCompletion({ questionnaireId, institutionId }).then(
			(result) => {
				if (active) setAlreadySubmitted(result.ok && result.alreadySubmitted);
			},
		);
		return () => {
			active = false;
		};
	}, [questionnaireId, institutionId]);

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

	const options = useMemo(
		() =>
			searchResults.map((institution) => ({
				value: String(institution.id),
				label: institution.name,
				description: institution.address?.street
					? `${institution.address.street} ${institution.address.street_number ?? ""}`.trim()
					: t("content.institution.editSelectNoAddress", {
							defaultValue: "Keine Adresse hinterlegt",
						}),
			})),
		[searchResults, t],
	);

	const handleSelect = useCallback(
		(value: string) => {
			onChange({ institutionId: Number(value) });
		},
		[onChange],
	);

	const canProceed =
		isInstitutionRegistered === true &&
		institutionId !== null &&
		!alreadySubmitted;
	let radioValue = "";
	if (isInstitutionRegistered === true) radioValue = "yes";
	else if (isInstitutionRegistered === false) radioValue = "no";

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
						defaultValue:
							"Ist der Kulturort bereits im Kulturkataster erfasst?",
					})}
				</Label>
				<RadioGroup
					value={radioValue}
					onValueChange={(value) =>
						onChange({
							isInstitutionRegistered: value === "yes",
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

				{isInstitutionRegistered === true && (
					<div className="space-y-2 rounded-sm bg-neutral-10 p-4">
						<>
							<Label className="text-neutral-80">
								{t("content.questionnaireWizard.institutionLink.searchLabel", {
									defaultValue: "Name des Kulturortes",
								})}
							</Label>
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
								<>
									<Label className="text-neutral-80">
										{t(
											"content.questionnaireWizard.institutionLink.resultsLabel",
											{
												defaultValue: "Ausgewählter Kulturort",
											},
										)}
									</Label>
									<SelectableOptionsList
										options={options}
										selectedValues={
											institutionId ? [String(institutionId)] : []
										}
										multiSelect={false}
										variant="panel"
										showCheckbox={true}
										containerClassName="overflow-hidden"
										listClassName="max-h-72"
										emptyText={t(
											"content.questionnaireWizard.institutionLink.searchEmpty",
											{ defaultValue: "Keine Kulturorte gefunden." },
										)}
										onToggle={handleSelect}
									/>
								</>
							)}
						</>
					</div>
				)}

				<AlertDialog
					open={alreadySubmitted}
					status="info"
					title={t(
						"content.questionnaireWizard.institutionLink.alreadySubmittedTitle",
						{ defaultValue: "Bereits ausgefüllt" },
					)}
					description={t(
						"content.questionnaireWizard.institutionLink.alreadySubmitted",
						{
							defaultValue:
								"Für diesen Kulturort wurde diese Befragung bereits ausgefüllt.",
						},
					)}
					confirmLabel={t("common.close", { defaultValue: "Schließen" })}
					onConfirm={() => onChange({ institutionId: null })}
					onOpenChange={(open) => {
						if (!open) onChange({ institutionId: null });
					}}
				/>
			</Card>

			{isInstitutionRegistered === false && (
				<Card variant="secondary">
					<QuestionnaireInstitutionCreateForm
						categoryGroups={categoryGroups}
						initialValues={pendingInstitutionData ?? undefined}
						onCreated={(data) => {
							onChange({ pendingInstitutionData: data });
							onNext();
						}}
						onBack={onBack}
						backLabel={t("common.back", { defaultValue: "Zurück" })}
						submitLabel={t("common.next", { defaultValue: "Weiter" })}
					/>
				</Card>
			)}

			{isInstitutionRegistered !== false && (
				<div className="flex flex-col-reverse gap-4 md:flex-row md:justify-end">
					<Button type="button" variant="outline" fullWidth onClick={onBack}>
						{t("common.back", { defaultValue: "Zurück" })}
					</Button>
					<Button
						type="button"
						fullWidth
						disabled={!canProceed}
						onClick={onNext}
					>
						{t("common.next", { defaultValue: "Weiter" })}
					</Button>
				</div>
			)}
		</div>
	);
}
