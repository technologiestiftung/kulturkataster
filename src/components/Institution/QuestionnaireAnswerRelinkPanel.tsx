"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LocationSearch } from "@/components/Search/LocationSearch";
import { SelectableOptionsList } from "@/components/MultiSelect/SelectableOptionsList";
import { searchInstitutions } from "@/server/actions/institutions";
import {
	getLinkedQuestionnaireAnswersCount,
	relinkQuestionnaireAnswers,
} from "@/server/actions/questionnaires";
import type { Institution } from "@/types/institution";

// Shown in the submission review UI when a "create" institution submission has
// questionnaire answers linked to it (Answer.submission_id) — e.g. the respondent
// answered the questionnaire inline while proposing this venue. Lets an admin
// manually re-point those answers at a different, existing institution — useful
// when the proposal turns out to be a duplicate. The common case (approving this
// exact submission) already auto-relinks to the newly created institution, so
// this panel is only for the "actually, use a different institution" case.
export function QuestionnaireAnswerRelinkPanel({
	submissionId,
}: {
	submissionId: number;
}) {
	const { t } = useTranslation();
	const [count, setCount] = useState(0);
	const [isPicking, setIsPicking] = useState(false);
	const [query, setQuery] = useState("");
	const [searchResults, setSearchResults] = useState<Institution[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [relinked, setRelinked] = useState(false);

	useEffect(() => {
		let active = true;
		void getLinkedQuestionnaireAnswersCount(submissionId).then((result) => {
			if (active && result.ok) setCount(result.count);
		});
		return () => {
			active = false;
		};
	}, [submissionId]);

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
			})),
		[searchResults],
	);

	if (count === 0 || relinked) return null;

	const handleRelink = async () => {
		if (selectedId === null) return;
		setIsSaving(true);
		const result = await relinkQuestionnaireAnswers({
			fromSubmissionId: submissionId,
			toInstitutionId: selectedId,
		});
		setIsSaving(false);
		if (result.ok) {
			setRelinked(true);
			setIsPicking(false);
		}
	};

	return (
		<Card variant="tertiary">
			<CardContent variant="tertiary" className="space-y-3 p-3">
				<p className="body2">
					{t("content.institutionFormModal.review.linkedAnswers", {
						defaultValue:
							"{{count}} Fragebogen-Antworten sind mit dieser Einreichung verknüpft.",
						count,
					})}
				</p>
				{!isPicking ? (
					<Button
						type="button"
						variant="outline"
						onClick={() => setIsPicking(true)}
					>
						{t("content.institutionFormModal.review.relinkAnswers", {
							defaultValue: "Verknüpfung ändern",
						})}
					</Button>
				) : (
					<div className="space-y-2">
						<Label className="text-neutral-80">
							{t(
								"content.institutionFormModal.review.relinkAnswersSearchLabel",
								{ defaultValue: "Anderen Kulturort auswählen" },
							)}
						</Label>
						<LocationSearch
							onQueryChange={setQuery}
							showResults={false}
							searchFunction={async () => []}
						/>
						{options.length > 0 && (
							<SelectableOptionsList
								options={options}
								selectedValues={selectedId ? [String(selectedId)] : []}
								multiSelect={false}
								variant="panel"
								showCheckbox={true}
								onToggle={(value) => setSelectedId(Number(value))}
							/>
						)}
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsPicking(false)}
								disabled={isSaving}
							>
								{t("common.cancel", { defaultValue: "Abbrechen" })}
							</Button>
							<Button
								type="button"
								onClick={handleRelink}
								disabled={selectedId === null || isSaving}
							>
								{t("common.save", { defaultValue: "Speichern" })}
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
