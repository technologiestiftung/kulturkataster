"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Modal } from "@/components/Modals/Modal";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useInstitutionDraftStore } from "@/lib/store/institutionDraftStore";
import { Label } from "../ui/label";

type DraftMode = "new" | "edit";

type AuthChoiceContentProps = {
	t: (key: string) => string;
	onLogin: () => void;
	onGuestContinue: () => void;
};

function AuthChoiceContent({
	t,
	onLogin,
	onGuestContinue,
}: AuthChoiceContentProps) {
	return (
		<div className="my-18 space-y-10">
			<div>
				<h1 className="font-bold">{t("institutionDraftIntroModal.title")}</h1>
				<h2 className="font-bold">
					{t("institutionDraftIntroModal.choice.title")}
				</h2>
			</div>
			<div className="space-y-2">
				<div>
					<h3 className="font-bold">
						{t("institutionDraftIntroModal.choice.login.title")}
					</h3>
					<p className="body2">
						{t("institutionDraftIntroModal.choice.login.description")}
					</p>
				</div>
				<div className="flex ">
					<Button variant="default" onClick={onLogin}>
						{t("institutionDraftIntroModal.choice.login.cta")}
					</Button>
				</div>
			</div>
			<div className="space-y-2">
				<div>
					<h3 className="font-bold">
						{t("institutionDraftIntroModal.choice.guest.title")}
					</h3>
					<p className="body2">
						{t("institutionDraftIntroModal.choice.guest.description")}
					</p>
				</div>
				<div className="flex">
					<Button variant="default" onClick={onGuestContinue}>
						{t("institutionDraftIntroModal.choice.guest.cta")}
					</Button>
				</div>
			</div>
		</div>
	);
}

type ContributionSetupContentProps = {
	t: (key: string) => string;
	mode: DraftMode;
	setMode: (mode: DraftMode) => void;
	onContinue: () => void;
};

function ContributionSetupContent({
	t,
	mode,
	setMode,
	onContinue,
}: ContributionSetupContentProps) {
	return (
		<>
			<div className="mt-18">
				<h1 className="font-bold">{t("institutionDraftIntroModal.title")}</h1>
				<p className="font-bold">
					{t("institutionDraftIntroModal.intro.thankYou")}
				</p>
			</div>
			<p>{t("institutionDraftIntroModal.intro.description")}</p>
			<div className="space-y-2">
				<h2 className="font-bold">
					{t("institutionDraftIntroModal.intro.sectionTitle")}
				</h2>
				<span className="body2">
					{t("institutionDraftIntroModal.intro.sectionNote")}
				</span>
			</div>
			<div className="space-y-2 my-12 rounded-md bg-primary-light/50 p-12">
				<p className="font-bold">
					{t("institutionDraftIntroModal.intro.mode.title")}
				</p>
				<span className="body2">
					{t("institutionDraftIntroModal.intro.mode.description")}
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
							<Label
								htmlFor="new"
								emphasize={false}
								className="flex items-center gap-2 cursor-pointer"
							>
								{t("institutionDraftIntroModal.intro.mode.new")}
							</Label>
						</div>
						<div key="edit" className="flex items-center space-x-2">
							<RadioGroupItem
								value="edit"
								className="bg-background border-none"
								id="edit"
							/>
							<Label
								htmlFor="edit"
								emphasize={false}
								className="flex items-center gap-2 cursor-pointer"
							>
								{t("institutionDraftIntroModal.intro.mode.edit")}
							</Label>
						</div>
					</RadioGroup>
				</div>
			</div>
			<div className="flex">
				<Button variant="default" onClick={onContinue}>
					{t("institutionDraftIntroModal.intro.cta")}
				</Button>
			</div>
		</>
	);
}

export function InstitutionDraftIntroModal({
	routePath,
	isAuthenticated,
}: {
	routePath?: string;
	isAuthenticated: boolean;
}) {
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation("content");
	const [mode, setMode] = useState<DraftMode>("new");
	const [isGuestSetupVisible, setIsGuestSetupVisible] = useState(false);
	const resetDraft = useInstitutionDraftStore((state) => state.resetDraft);
	const setModeInStore = useInstitutionDraftStore((state) => state.setMode);

	const handleContinue = () => {
		resetDraft();
		if (mode === "edit") {
			setModeInStore("update");
			router.push(toLocalePath("/institution/submission/select"));
			return;
		}
		setModeInStore("create");
		router.push(toLocalePath("/institution/submission"));
	};

	const handleGuestContinue = () => {
		setIsGuestSetupVisible(true);
	};

	const showContributionSetup = isAuthenticated || isGuestSetupVisible;

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
				<div className="p-4 space-y-4 flex-1 flex-col max-w-5xl mx-auto w-full mb-20">
					{showContributionSetup ? (
						<ContributionSetupContent
							t={t}
							mode={mode}
							setMode={setMode}
							onContinue={handleContinue}
						/>
					) : (
						<AuthChoiceContent
							t={t}
							onLogin={() => router.push(toLocalePath("/login"))}
							onGuestContinue={handleGuestContinue}
						/>
					)}
				</div>
			}
		/>
	);
}
