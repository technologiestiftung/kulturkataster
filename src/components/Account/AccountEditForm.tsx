"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { updateUser, removeUser } from "@/server/actions/users";
import { updateMyPassword, logout } from "@/server/actions/auth";
import { useAccountStore } from "@/lib/store/accountStore";

type AccountEditFormProps = {
	userId: string;
	email: string | null;
	firstName?: string | null;
	lastName?: string | null;
};

const splitName = (value: string) => {
	const trimmed = value.trim();
	if (!trimmed) return { firstName: undefined, lastName: undefined };
	const parts = trimmed.split(/\s+/);
	const firstName = parts.shift() ?? "";
	const lastName = parts.length ? parts.join(" ") : undefined;
	return { firstName, lastName };
};

export function AccountEditForm({
	userId,
	email,
	firstName,
	lastName,
}: AccountEditFormProps) {
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation("common");
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const setAlertDialog = useAccountStore((state) => state.setAlertDialog);

	const initialName = useMemo(() => {
		const parts = [firstName, lastName].filter(Boolean);
		return parts.length ? parts.join(" ") : "";
	}, [firstName, lastName]);

	const handleSubmit = async (data: Record<string, unknown>) => {
		const nameValue = String(data.name ?? "");
		const nextEmail = String(data.email ?? "");
		const password = String(data.password ?? "");
		const confirmPassword = String(data.confirmPassword ?? "");

		setIsLoading(true);
		setErrorMessage(null);

		try {
			if (password && password !== confirmPassword) {
				setErrorMessage(t("auth.validation.passwordMismatch"));
				return;
			}

			const { firstName: nextFirst, lastName: nextLast } = splitName(nameValue);

			await updateUser({
				id: userId,
				email: nextEmail,
				first_name: nextFirst ?? "",
				last_name: nextLast ?? "",
			});

			if (password) {
				const result = await updateMyPassword(password);
				if (!result.ok) {
					setErrorMessage(result.error ?? t("auth.accountEdit.errorFallback"));
					return;
				}
			}

			setAlertDialog({
				title: t("auth.accountEdit.successTitle"),
				description: t("auth.accountEdit.successDescription"),
			});

			router.replace(toLocalePath("/account"));
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: t("auth.accountEdit.errorFallback"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	const formConfig: FormWrapperConfig = {
		formId: "account-edit-form",
		onSubmit: handleSubmit,
		hideActions: true,
		initialValues: {
			name: initialName,
			email,
		},
		layout: { columns: 1 },
		fields: [
			{
				name: "section",
				type: "section",
				cardVariant: "secondary",
				fields: [
					{
						name: "name",
						label: t("auth.accountEdit.nameLabel"),
						type: "text",
						placeholder: t("auth.accountEdit.namePlaceholder"),
						required: true,
						disabled: isLoading,
					},
					{
						name: "email",
						label: t("auth.accountEdit.emailLabel"),
						type: "email",
						placeholder: t("auth.accountEdit.emailPlaceholder"),
						required: true,
						disabled: isLoading,
					},
					{
						name: "password",
						label: t("auth.accountEdit.passwordLabel"),
						type: "password",
						placeholder: t("auth.accountEdit.passwordPlaceholder"),
						disabled: isLoading,
						validate: (value) => {
							if (!value) return undefined;
							const text = String(value);
							if (text.length < 8) {
								return t("auth.validation.passwordMin");
							}
							return undefined;
						},
					},
					{
						name: "confirmPassword",
						label: t("auth.accountEdit.confirmPasswordLabel"),
						type: "password",
						placeholder: t("auth.accountEdit.confirmPasswordPlaceholder"),
						disabled: isLoading,
						validateWithForm: (value, formData) => {
							const passwordValue = String(formData.password ?? "");
							if (!passwordValue) return undefined;
							const confirmValue = String(value ?? "");
							if (confirmValue !== passwordValue) {
								return t("auth.validation.passwordMismatch");
							}
							return undefined;
						},
					},
				],
			},
		],
	};

	const handleDelete = async () => {
		setIsLoading(true);
		setErrorMessage(null);
		try {
			await removeUser(userId);
			await logout();
			router.replace(toLocalePath("/"));
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: t("auth.accountEdit.deleteError"),
			);
		} finally {
			setIsLoading(false);
			setShowDeleteConfirm(false);
		}
	};

	return (
		<div className="w-full max-w-3xl mx-auto">
			<div className="text-start font-bold mb-10">
				<h1 className="">{t("auth.accountEdit.title")}</h1>
			</div>

			<AlertDialog
				title={t("error")}
				status="error"
				description={errorMessage ?? ""}
				open={Boolean(errorMessage)}
				onOpenChange={(open) => {
					if (!open) {
						setErrorMessage(null);
					}
				}}
				confirmLabel={t("close")}
				onConfirm={() => setErrorMessage(null)}
			/>

			<AlertDialog
				status="warning"
				title={t("auth.accountEdit.deleteTitle")}
				description={t("auth.accountEdit.deleteDescription")}
				open={showDeleteConfirm}
				onOpenChange={(open) => setShowDeleteConfirm(open)}
				confirmLabel={t("auth.accountEdit.deleteConfirm")}
				onConfirm={handleDelete}
			/>

			<FormWrapper config={formConfig} />

			<div className="flex flex-col gap-3 mt-6">
				<div className="flex items-center justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.replace(toLocalePath("/account"))}
						disabled={isLoading}
					>
						{t("cancel")}
					</Button>
					<Button type="submit" form="account-edit-form" disabled={isLoading}>
						{isLoading
							? t("auth.accountEdit.submitting")
							: t("auth.accountEdit.submit")}
					</Button>
				</div>
				<Button
					type="button"
					variant="ghost"
					className="self-start text-destructive"
					onClick={() => setShowDeleteConfirm(true)}
					disabled={isLoading}
				>
					{t("auth.accountEdit.deleteAction")}
				</Button>
			</div>
		</div>
	);
}
