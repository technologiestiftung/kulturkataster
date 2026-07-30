"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SubmissionDecisionEmailTemplate } from "@/types/submission";
import Mail from "@/icons/mail.svg";

export type ApprovalSubmitterEmailTemplate = Extract<
	SubmissionDecisionEmailTemplate,
	"submission_create_approved" | "submission_update_approved" | "claim_approved"
>;

export type RejectionSubmitterEmailTemplate = Extract<
	SubmissionDecisionEmailTemplate,
	"submission_rejected" | "claim_rejected"
>;

export type VisibleSubmitterEmailTemplate =
	| "submission_create_approved"
	| "submission_update_approved"
	| "claim_approved"
	| "submission_rejected"
	| "claim_rejected";

export const APPROVAL_EMAIL_TEMPLATES: ApprovalSubmitterEmailTemplate[] = [
	"submission_create_approved",
	"submission_update_approved",
	"claim_approved",
];

export const REJECTION_EMAIL_TEMPLATES: RejectionSubmitterEmailTemplate[] = [
	"submission_rejected",
	"claim_rejected",
];

export const getDecisionEmailTemplatePath = (
	template: VisibleSubmitterEmailTemplate,
) => `custom/${template}.html`;

export const pickAvailableTemplate = <T extends VisibleSubmitterEmailTemplate>(
	preferred: T[],
	availableTemplatePaths: string[] | null,
	fallback: T,
) => {
	if (!availableTemplatePaths) return fallback;
	return (
		preferred.find((template) =>
			availableTemplatePaths.includes(getDecisionEmailTemplatePath(template)),
		) ?? fallback
	);
};

type TemplateOption<T extends VisibleSubmitterEmailTemplate> = {
	value: T;
	label: string;
};

type SubmissionDecisionEmailPanelProps = {
	t: (key: string, options?: Record<string, unknown>) => string;
	notifySubmitter: boolean;
	onNotifySubmitterChange: (checked: boolean) => void;
	approvalEmailTemplate: ApprovalSubmitterEmailTemplate;
	onApprovalEmailTemplateChange: (
		template: ApprovalSubmitterEmailTemplate,
	) => void;
	approvalEmailTemplateOptions: TemplateOption<ApprovalSubmitterEmailTemplate>[];
	rejectionEmailTemplate: RejectionSubmitterEmailTemplate;
	onRejectionEmailTemplateChange: (
		template: RejectionSubmitterEmailTemplate,
	) => void;
	rejectionEmailTemplateOptions: TemplateOption<RejectionSubmitterEmailTemplate>[];
	isLoadingDecisionEmailTemplates: boolean;
	submitting: boolean;
	isTemplateAvailable: (template: VisibleSubmitterEmailTemplate) => boolean;
};

const getTemplatePreviewUrl = (template: VisibleSubmitterEmailTemplate) =>
	`/api/emails/${getDecisionEmailTemplatePath(template)}`;

export function SubmissionDecisionEmailPanel({
	t,
	notifySubmitter,
	onNotifySubmitterChange,
	approvalEmailTemplate,
	onApprovalEmailTemplateChange,
	approvalEmailTemplateOptions,
	rejectionEmailTemplate,
	onRejectionEmailTemplateChange,
	rejectionEmailTemplateOptions,
	isLoadingDecisionEmailTemplates,
	submitting,
	isTemplateAvailable,
}: SubmissionDecisionEmailPanelProps) {
	const hasApprovalEmailTemplate = approvalEmailTemplateOptions.length > 0;
	const hasRejectionEmailTemplate = rejectionEmailTemplateOptions.length > 0;

	return (
		<Card variant="tertiary">
			<CardContent variant="tertiary" className="p-3">
				<div className="rounded-sm border border-border bg-background p-4">
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-2">
							<Mail className="h-5 w-5 text-primary-dark" />
							<Label className="body2">
								{t("content.institutionFormModal.review.emailPanelTitle", {
									defaultValue: "E-Mail-Benachrichtigung",
								})}
							</Label>
						</div>
						<p className="body2 text-neutral-80">
							{t("content.institutionFormModal.review.emailPanelDescription", {
								defaultValue:
									"Wählen Sie aus, welche Vorlage bei Genehmigung oder Ablehnung verwendet wird.",
							})}
						</p>
						<label className="flex items-start gap-3">
							<Checkbox
								checked={notifySubmitter}
								onCheckedChange={(checked) =>
									onNotifySubmitterChange(checked === true)
								}
								disabled={submitting}
							/>

							<span className="body2">
								{t("content.institutionFormModal.review.notifySubmitter")}
							</span>
						</label>
						{notifySubmitter ? (
							<div className="flex flex-col gap-4">
								<div className="flex flex-col gap-2">
									<Label
										htmlFor="submission-approval-email-template"
										className="body2"
									>
										{t(
											"content.institutionFormModal.review.approvalEmailTemplateLabel",
											{
												defaultValue: "E-Mail bei Genehmigung",
											},
										)}
									</Label>
									<div className="flex flex-col gap-2">
										<Select
											value={approvalEmailTemplate}
											onValueChange={(value) =>
												onApprovalEmailTemplateChange(
													value as ApprovalSubmitterEmailTemplate,
												)
											}
											disabled={
												submitting ||
												isLoadingDecisionEmailTemplates ||
												!hasApprovalEmailTemplate
											}
										>
											<SelectTrigger id="submission-approval-email-template">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{approvalEmailTemplateOptions.map((template) => (
													<SelectItem
														key={template.value}
														value={template.value}
													>
														{template.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Button
											type="button"
											variant="outline"
											disabled={
												submitting ||
												isLoadingDecisionEmailTemplates ||
												!isTemplateAvailable(approvalEmailTemplate)
											}
											onClick={() =>
												window.open(
													getTemplatePreviewUrl(approvalEmailTemplate),
													"_blank",
												)
											}
										>
											{t(
												"content.institutionFormModal.review.previewApprovalEmail",
												{
													defaultValue: "Genehmigungs-E-Mail anzeigen",
												},
											)}
										</Button>
									</div>
								</div>
								<div className="flex flex-col gap-2">
									<Label
										htmlFor="submission-rejection-email-template"
										className="body2"
									>
										{t(
											"content.institutionFormModal.review.rejectionEmailTemplateLabel",
											{
												defaultValue: "E-Mail bei Ablehnung",
											},
										)}
									</Label>
									<div className="flex flex-col gap-2">
										<Select
											value={rejectionEmailTemplate}
											onValueChange={(value) =>
												onRejectionEmailTemplateChange(
													value as RejectionSubmitterEmailTemplate,
												)
											}
											disabled={
												submitting ||
												isLoadingDecisionEmailTemplates ||
												!hasRejectionEmailTemplate
											}
										>
											<SelectTrigger id="submission-rejection-email-template">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{rejectionEmailTemplateOptions.map((template) => (
													<SelectItem
														key={template.value}
														value={template.value}
													>
														{template.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Button
											type="button"
											variant="outline"
											onClick={() =>
												window.open(
													getTemplatePreviewUrl(rejectionEmailTemplate),
													"_blank",
												)
											}
											disabled={
												submitting ||
												isLoadingDecisionEmailTemplates ||
												!isTemplateAvailable(rejectionEmailTemplate)
											}
										>
											{t(
												"content.institutionFormModal.review.previewRejectionEmail",
												{
													defaultValue: "Ablehnungs-E-Mail anzeigen",
												},
											)}
										</Button>
									</div>
								</div>
							</div>
						) : null}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
