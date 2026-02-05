"use client";

import { RegisterForm } from "@/components/Auth/RegisterForm";
import { Modal } from "@/components/Modals/Modal";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useLocalePath } from "@/lib/hooks/useLocalePath";

export function RegisterModal({
	routePath,
	returnTo,
}: {
	routePath?: string;
	returnTo?: string;
}) {
	const { t } = useTranslation("common");
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const [didRegister, setDidRegister] = useState(false);

	return (
		<Modal
			title={t("auth.register.title")}
			titleClassName="sr-only"
			variant="fullscreen"
			routePath={routePath}
			containerClassName="p-0 md:p-0 mt-0 md:mt-0"
			contentWrapperClassName="flex-1"
			contentClassName=""
			returnTo={didRegister ? toLocalePath("/login") : returnTo}
			content={
				<>
					{didRegister ? (
						<div className="w-full space-y-6 text-left">
							<div className="h-50 relative w-full overflow-hidden">
								<Image
									src="/resources/map.png"
									alt="Map background"
									fill
									className="object-cover"
									priority
								/>
							</div>
							<div className="p-4 md:p-8 mb-64 mt-14 flex justify-center flex-col gap-8 max-w-3xl mx-auto w-full">
								<div className="space-y-4">
									<h1 className="display">
										{t("auth.register.successTitle", {
											defaultValue: "Vielen Dank!",
										})}
									</h1>
									<p className="text-foreground">
										{t("auth.register.successMessage", {
											defaultValue:
												"In Kürze erhalten Sie eine Bestätigungs-E-Mail mit dem Link zu Ihrem Login.",
										})}
									</p>
								</div>
								<div>
									<Button
										variant="default"
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
						<div className="w-full flex flex-1 items-center justify-center py-12 px-4">
							<RegisterForm onSuccess={() => setDidRegister(true)} />
						</div>
					)}
				</>
			}
		/>
	);
}
