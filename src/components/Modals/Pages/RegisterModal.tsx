"use client";

import { RegisterForm } from "@/components/Auth/RegisterForm";
import { Modal } from "@/components/Modals/Modal";
import { useTranslation } from "react-i18next";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { Button } from "@/components/ui/button";

export function RegisterModal({
	routePath,
	returnTo,
}: {
	routePath?: string;
	returnTo?: string;
}) {
	const { t } = useTranslation("common");
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const toLocalePath = useLocalePath();
	const [didRegister, setDidRegister] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);
	const didRegisterViaUrl = searchParams.get("registered") === "1";
	const showSuccess = didRegister || didRegisterViaUrl;

	useEffect(() => {
		if (!showSuccess) return;

		const rafId = requestAnimationFrame(() => {
			const modalScrollContainer = contentRef.current?.closest(
				".Modal-Root",
			) as HTMLElement | null;
			modalScrollContainer?.scrollTo({ top: 0, behavior: "auto" });
		});

		return () => cancelAnimationFrame(rafId);
	}, [showSuccess]);

	const handleRegisterSuccess = () => {
		setDidRegister(true);
		const params = new URLSearchParams(searchParams.toString());
		params.set("registered", "1");
		const query = params.toString();
		router.replace(query ? `${pathname}?${query}` : pathname, {
			scroll: true,
		});
	};

	return (
		<Modal
			title={t("auth.register.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			contentWrapperClassName="flex-1"
			contentClassName=""
			showBackButton
			returnTo={returnTo ?? "/login"}
		>
			<div ref={contentRef}>
				{showSuccess ? (
					<div className="w-full space-y-6 text-left">
						<div className="h-50 relative w-screen -mt-32 -my-4 left-1/2 -translate-x-1/2 overflow-hidden mb-16">
							<Image
								src="/resources/thankyou.png"
								alt="Thank you background"
								fill
								className="object-cover contrast:invert-90"
								priority
							/>
						</div>
						<div className="p-4 md:p-8 mb-64 mt-14 flex justify-center flex-col gap-8 max-w-3xl mx-auto w-full">
							<div className="space-y-4">
								<h1>
									{t("auth.register.successTitle", {
										defaultValue: "Vielen Dank!",
									})}
								</h1>
								<p className="text-foreground">
									{t("auth.register.successMessage", {
										defaultValue:
											"Wenn ein Konto mit den angegebenen Daten erstellt werden kann, erhalten Sie in Kürze eine E-Mail mit einem Bestätigungslink.",
									})}
								</p>
							</div>
							<div>
								<Button
									variant="primary"
									className="w-full"
									onClick={() => router.replace(toLocalePath("/login"))}
								>
									{t("auth.register.successCta", {
										defaultValue: "Fertig",
									})}
								</Button>
							</div>
						</div>
					</div>
				) : (
					<div className="w-full flex flex-1 items-center justify-center">
						<RegisterForm onSuccess={handleRegisterSuccess} />
					</div>
				)}
			</div>
		</Modal>
	);
}
