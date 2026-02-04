"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Modal } from "@/components/Modals/Modal";
import { useInstitutionDraftStore } from "@/lib/store/institutionDraftStore";

export function InstitutionDraftIntroModal({
	routePath,
}: {
	routePath?: string;
}) {
	const router = useRouter();
	const [mode, setMode] = useState<"new" | "edit">("new");
	const resetDraft = useInstitutionDraftStore((state) => state.resetDraft);
	const setModeInStore = useInstitutionDraftStore((state) => state.setMode);

	const handleContinue = () => {
		resetDraft();
		if (mode === "edit") {
			setModeInStore("update");
			router.push("/institution/submission/select");
			return;
		}
		setModeInStore("create");
		router.push("/institution/submission");
	};

	return (
		<Modal
			title="Mitwirken beim Kulturkataster Berlin"
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			containerClassName="p-0 md:p-0 mt-0 md:mt-0"
			contentWrapperClassName="flex-1"
			contentClassName=""
			content={
				<div className="p-4 space-y-4 flex-1 flex-col max-w-5xl mx-auto w-full">
					<div className="mt-18">
						<h1 className="font-bold">Mitwirken beim Kulturkataster Berlin</h1>
						<p className="font-bold">
							Vielen Dank, dass Sie das Kulturkataster Berlin mit Ihrem Beitrag
							unterstützen!
						</p>
					</div>
					<p>
						Zum Mitwirken tragen Sie bitte die benötigten Angaben in die
						jeweiligen Felder ein und klicken Sie am Ende des Formulars auf
						„Daten übermitteln“. Unser Redaktionsteam prüft jede Einsendung vor
						der Veröffentlichung und meldet sich ggfs. bei Rückfragen.
					</p>
					<div className="space-y-2">
						<h2 className="font-bold">
							Basisinformation der Kultureinrichtung
						</h2>
						<span className="body2">
							Bitte beachten Sie, dass Sie Angaben nur dann machen sollten, wenn
							Sie sich der Richtigkeit sicher sind und einer Einwilligung zur
							Veröffentlichung im Kulturkataster zustimmen. Sollten
							Informationen nur für befugte Nutzer*innen im geschützten Bereich
							des Kulturkatasters zugänglich und nicht öffentlich einsehbar
							sein, haben wir dies am jeweiligen Datenfeld gekennzeichnet.
						</span>
					</div>
					<div className="space-y-2 my-12 rounded-md bg-primary-light/50 p-12">
						<p className="font-bold">
							Möchten Sie eine neue Kultureinrichtung eintragen oder einen
							bestehenden Datensatz ergänzen bzw. korrigieren? *
						</p>
						<span className="body2">
							Wählen Sie die passende Kategorie für die Kultureinrichtung aus.
							Falls mehrere Kategorien zutreffen, wählen Sie die primäre
							Kategorie aus.
						</span>
						<div className="pt-4">
							<RadioGroup
								value={mode}
								onValueChange={(value) =>
									setMode(value === "edit" ? "edit" : "new")
								}
								className="flex flex-col gap-4"
							>
								<div key="new" className="flex items-center space-x-2">
									<RadioGroupItem
										value="new"
										className="bg-background border-none"
										id="new"
									/>
									<span className="flex items-center gap-2 cursor-pointer">
										Neue/n Kulturort/e eintragen
									</span>
								</div>
								<div key="edit" className="flex items-center space-x-2">
									<RadioGroupItem
										value="edit"
										className="bg-background border-none"
										id="edit"
									/>
									<span className="flex items-center gap-2 cursor-pointer">
										Ergänzung oder Änderung eines oder mehrere bestehender
										Kulturorte
									</span>
								</div>
							</RadioGroup>
						</div>
					</div>
					<div className="flex">
						<Button variant="default" onClick={handleContinue}>
							Weiter
						</Button>
					</div>
				</div>
			}
		/>
	);
}
