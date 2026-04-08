"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { FormWrapper, minLength } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useLocalePath } from "@/lib/hooks/useLocalePath";
import { updateUser, deleteUser } from "@/server/actions/users";
import { updateMyPassword, logout } from "@/server/actions/auth";
import { clearAccountStore } from "@/lib/store/accountStore";
import { splitDisplayName } from "@/lib/utils/userName";

type AccountEditFormProps = {
	userId: string;
	email: string | null;
	firstName?: string | null;
	lastName?: string | null;
	onSuccess?: () => void;
	onCancel?: () => void;
};

export function AccountEditForm({
	userId,
	email,
	firstName,
	lastName,
	onSuccess,
	onCancel,
}: AccountEditFormProps) {
	const router = useRouter();
	const toLocalePath = useLocalePath();
	const { t } = useTranslation("common");
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

			const { firstName: nextFirst, lastName: nextLast } =
				splitDisplayName(nameValue);

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

			onSuccess?.();
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
		submitLabel: isLoading
			? t("auth.accountEdit.submitting")
			: t("auth.accountEdit.submit"),
		submitDisabled: isLoading,
		showCancel: true,
		cancelLabel: t("cancel"),
		onCancel,
		deleteAction: {
			label: t("auth.accountEdit.deleteAction"),
			onClick: () => setShowDeleteConfirm(true),
			disabled: isLoading,
			className: "p-0!",
		},
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
						afterField: t("auth.accountEdit.passwordRequirements"),
						placeholder: t("auth.accountEdit.passwordPlaceholder"),
						disabled: isLoading,
						validators: [minLength(8, t("auth.validation.passwordMin"))],
					},
					{
						name: "confirmPassword",
						label: t("auth.accountEdit.confirmPasswordLabel"),
						type: "password",
						placeholder: t("auth.accountEdit.confirmPasswordPlaceholder"),
						disabled: isLoading,
						validators: [
							(value, formData) => {
								const passwordValue = String(formData.password ?? "");
								if (!passwordValue) return undefined;
								const confirmValue = String(value ?? "");
								if (confirmValue !== passwordValue) {
									return t("auth.validation.passwordMismatch");
								}
								return undefined;
							},
						],
					},
				],
			},
		],
	};

	const handleDelete = async () => {
		setIsLoading(true);
		setErrorMessage(null);
		try {
			await deleteUser(userId);
			const result = await logout();
			if (result.ok) {
				await clearAccountStore();
			}
			router.replace(toLocalePath("/"));
			onSuccess?.();
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
		<div className="w-full md:max-w-3xl mx-auto">
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
				cancelLabel={t("cancel")}
				onCancel={() => setShowDeleteConfirm(false)}
				onConfirm={handleDelete}
			/>
			<div className="flex-1 overflow-auto flex flex-col">
				<FormWrapper config={formConfig} />
			</div>
		</div>
	);
}
