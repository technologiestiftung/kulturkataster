"use client";

import { useEffect, useState } from "react";
import type { UserEmailTemplateOption } from "@/server/actions/users";
import {
	getUserEmailTemplateOptions,
	sendUserEmailTemplate,
} from "@/server/actions/users";
import type { User } from "@/types/user";
import { showErrorToast, showSuccessToast } from "@/lib/utils/feedbackToast";
import Mail from "@/icons/mail.svg";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { AlertDialog } from "@/components/ui/alert-dialog";

const getTemplateLabel = (
	template: UserEmailTemplateOption,
	t: (key: string, options?: Record<string, unknown>) => string,
) =>
	t(`userFormModal.templateEmail.templates.${template.key}`, {
		defaultValue: template.name ?? template.key,
	});

const sortUserEmailTemplates = (
	templates: UserEmailTemplateOption[],
	t: (key: string, options?: Record<string, unknown>) => string,
) =>
	[...templates].sort((left, right) => {
		const leftHasRole = left.key.toLowerCase().includes("role");
		const rightHasRole = right.key.toLowerCase().includes("role");

		if (leftHasRole !== rightHasRole) {
			return leftHasRole ? -1 : 1;
		}

		return getTemplateLabel(left, t).localeCompare(getTemplateLabel(right, t));
	});

type UserTemplateEmailPanelProps = {
	user: User;
	t: (key: string, options?: Record<string, unknown>) => string;
};

export function UserTemplateEmailPanel({
	user,
	t,
}: UserTemplateEmailPanelProps) {
	const [templates, setTemplates] = useState<UserEmailTemplateOption[]>([]);
	const [selectedTemplatePath, setSelectedTemplatePath] = useState("");
	const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
	const [isSending, setIsSending] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	useEffect(() => {
		let isMounted = true;
		setIsLoadingTemplates(true);
		void getUserEmailTemplateOptions()
			.then((result) => {
				if (!isMounted) return;
				if (!result.ok) {
					showErrorToast(
						t("userFormModal.templateEmail.title"),
						t("userFormModal.templateEmail.loadError"),
					);
					setTemplates([]);
					return;
				}

				const sortedTemplates = sortUserEmailTemplates(result.data, t);
				setTemplates(sortedTemplates);
				setSelectedTemplatePath(
					(current) => current || sortedTemplates[0]?.path || "",
				);
			})
			.catch(() => {
				if (!isMounted) return;
				showErrorToast(
					t("userFormModal.templateEmail.title"),
					t("userFormModal.templateEmail.loadError"),
				);
			})
			.finally(() => {
				if (!isMounted) return;
				setIsLoadingTemplates(false);
			});

		return () => {
			isMounted = false;
		};
	}, [t]);

	const handleSendTemplate = async () => {
		if (!selectedTemplatePath || isSending) return;
		setIsSending(true);
		try {
			const result = await sendUserEmailTemplate({
				userId: user.id,
				templatePath: selectedTemplatePath,
			});
			if (!result.ok) {
				showErrorToast(
					t("userFormModal.templateEmail.title"),
					t("userFormModal.templateEmail.error"),
				);
				return;
			}
			showSuccessToast(
				t("userFormModal.templateEmail.title"),
				t("userFormModal.templateEmail.success"),
			);
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div className="rounded-sm border border-border bg-background p-4">
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<Mail className="h-5 w-5 text-primary-dark" />
					<Label className="body2">
						{t("userFormModal.templateEmail.title")}
					</Label>
				</div>
				<p className="body2 text-neutral-80">
					{t("userFormModal.templateEmail.description")}
				</p>
				<div className="flex flex-col gap-2">
					<div className="flex-1 space-y-1">
						<Select
							value={selectedTemplatePath}
							onValueChange={setSelectedTemplatePath}
							disabled={
								isLoadingTemplates || templates.length === 0 || isSending
							}
						>
							<SelectTrigger id="user-email-template">
								<SelectValue
									placeholder={
										isLoadingTemplates
											? t("userFormModal.templateEmail.loading")
											: t("userFormModal.templateEmail.placeholder")
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{templates.map((template) => (
									<SelectItem key={template.path} value={template.path}>
										{getTemplateLabel(template, t)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							disabled={!selectedTemplatePath || isLoadingTemplates}
							onClick={() => {
								if (!selectedTemplatePath) return;
								window.open(`/api/emails/${selectedTemplatePath}`, "_blank");
							}}
						>
							{t("userFormModal.templateEmail.preview")}
						</Button>
						<Button
							type="button"
							disabled={
								!selectedTemplatePath || isLoadingTemplates || isSending
							}
							onClick={() => setShowConfirm(true)}
						>
							{t("userFormModal.templateEmail.send")}
						</Button>
					</div>
				</div>
			</div>
			{showConfirm && (
				<AlertDialog
					open
					status="warning"
					title={t("userFormModal.templateEmail.confirmTitle")}
					description={t("userFormModal.templateEmail.confirmDescription", {
						email: user.email,
					} as never)}
					confirmLabel={t("userFormModal.templateEmail.confirmSend")}
					cancelLabel={t("userFormModal.templateEmail.confirmCancel")}
					onConfirm={() => {
						setShowConfirm(false);
						void handleSendTemplate();
					}}
					onCancel={() => setShowConfirm(false)}
					onOpenChange={(open) => {
						if (!open) setShowConfirm(false);
					}}
				/>
			)}
		</div>
	);
}
