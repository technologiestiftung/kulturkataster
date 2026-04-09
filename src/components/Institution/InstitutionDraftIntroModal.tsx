"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trans, useTranslation } from "react-i18next";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Modal } from "@/components/Modals/Modal";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { useInstitutionDraftStore } from "@/lib/store/institutionDraftStore";
import { Label } from "../ui/label";
import Image from "next/image";

type DraftMode = "new" | "edit";

type AuthChoiceContentProps = {
	t: (key: string) => string;
	onLogin: () => void;
	onGuestContinue: () => void;
};

function AuthChoiceContent({ t, onGuestContinue }: AuthChoiceContentProps) {
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
				{/* <div className="flex ">
					<Button variant="primary" onClick={onLogin}>
						{t("institutionDraftIntroModal.choice.login.cta")}
					</Button>
				</div> */}
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
					<Button variant="primary" onClick={onGuestContinue}>
						{t("institutionDraftIntroModal.choice.guest.cta")}
					</Button>
				</div>
			</div>
		</div>
	);
}

type ContributionSetupContentProps = {
	t: (key: string) => string;
	toLocalePath: (path: string) => string;
	mode: DraftMode;
	setMode: (mode: DraftMode) => void;
	onContinue: () => void;
	onBack?: () => void;
	showBackButton?: boolean;
	showThankYou?: boolean;
};

function ContributionSetupContent({
	t,
	toLocalePath,
	mode,
	setMode,
	onContinue,
	onBack,
	showBackButton = false,
	showThankYou = false,
}: ContributionSetupContentProps) {
	return (
		<>
			{showThankYou ? (
				<div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
					<div className="h-50 relative w-screen -my-4 left-1/2 -mt-20 -translate-x-1/2 overflow-hidden mb-16">
						<Image
							src="/resources/thankyou.png"
							alt="Thank you background"
							fill
							className="object-cover contrast:invert-90"
							priority
						/>
					</div>
					<div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-700">
						<h1 className="font-extrabold">
							{t("institutionDraftIntroModal.submitSuccess.title")}
						</h1>
						<p className="body2 mt-2">
							<Trans
								i18nKey="institutionDraftIntroModal.submitSuccess.description"
								ns="content"
								components={[
									<Link
										key="account-link"
										href={toLocalePath("/account")}
										className="text-primary-dark underline"
									/>,
								]}
							/>
						</p>
					</div>
				</div>
			) : (
				<>
					<div className="mt-18">
						<h1 className="font-bold">
							{t("institutionDraftIntroModal.title")}
						</h1>
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
				</>
			)}

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
			<div className="flex items-center gap-3">
				{showBackButton && onBack ? (
					<Button variant="outline" onClick={onBack}>
						{t("institutionDraftIntroModal.intro.back")}
					</Button>
				) : null}
				<Button variant="primary" onClick={onContinue}>
					{showThankYou
						? t("institutionDraftIntroModal.submitSuccess.cta")
						: t("institutionDraftIntroModal.intro.cta")}
				</Button>
			</div>
		</>
	);
}

export function InstitutionDraftIntroModal({
	routePath,
	isAuthenticated,
	showThankYou = false,
}: {
	routePath?: string;
	isAuthenticated: boolean;
	showThankYou?: boolean;
}) {
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation("content");
	const [mode, setMode] = useState<DraftMode>("new");
	const [isGuestSetupVisible, setIsGuestSetupVisible] = useState(showThankYou);
	const resetDraft = useInstitutionDraftStore((state) => state.resetDraft);
	const setModeInStore = useInstitutionDraftStore((state) => state.setMode);
	const hasPlayedConfettiRef = useRef(false);

	useEffect(() => {
		if (!showThankYou || hasPlayedConfettiRef.current) return;

		hasPlayedConfettiRef.current = true;

		const baseConfig = {
			particleCount: 70,
			spread: 70,
			startVelocity: 45,
			gravity: 0.9,
			scalar: 0.9,
			origin: { y: 0.42 },
		};

		confetti({ ...baseConfig, origin: { x: 0.2, y: 0.42 } });
		confetti({ ...baseConfig, origin: { x: 0.8, y: 0.42 } });
		confetti({
			particleCount: 90,
			spread: 100,
			startVelocity: 38,
			origin: { x: 0.5, y: 0.35 },
		});
	}, [showThankYou]);

	const handleContinue = () => {
		resetDraft();
		if (mode === "edit") {
			setModeInStore("update");
			router.replace(toLocalePath("/institution/submission/select"));
			return;
		}
		setModeInStore("create");
		router.replace(toLocalePath("/institution/submission"));
	};

	const handleGuestContinue = () => {
		setIsGuestSetupVisible(true);
	};

	const showContributionSetup = isAuthenticated || isGuestSetupVisible;

	return (
		<Modal
			title={t("institutionDraftIntroModal.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			containerClassName=""
			contentWrapperClassName="flex-1"
			contentClassName=""
		>
			<div className="space-y-4 flex-1 flex-col max-w-5xl mx-auto w-full mb-20">
				{showContributionSetup ? (
					<ContributionSetupContent
						t={t}
						toLocalePath={toLocalePath}
						mode={mode}
						setMode={setMode}
						onContinue={handleContinue}
						showBackButton={!isAuthenticated}
						onBack={() => setIsGuestSetupVisible(false)}
						showThankYou={showThankYou}
					/>
				) : (
					<AuthChoiceContent
						t={t}
						onLogin={() => router.push(toLocalePath("/login"))}
						onGuestContinue={handleGuestContinue}
					/>
				)}
			</div>
		</Modal>
	);
}
