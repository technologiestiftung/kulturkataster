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

const translateAccountEditError = (
	t: (key: string) => string,
	errorCode: string,
) => {
	switch (errorCode) {
		case "emailTaken":
			return t("common.auth.accountEdit.errors.emailTaken");
		case "notFound":
			return t("common.auth.accountEdit.errors.notFound");
		case "forbidden":
			return t("common.auth.accountEdit.errors.forbidden");
		case "invalidInput":
			return t("common.auth.accountEdit.errors.invalidInput");
		default:
			return t("common.auth.accountEdit.errors.unexpected");
	}
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
	const { t } = useTranslation();
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
				setErrorMessage(t("common.auth.validation.passwordMismatch"));
				return;
			}

			const { firstName: nextFirst, lastName: nextLast } =
				splitDisplayName(nameValue);

			const result = await updateUser({
				id: userId,
				email: nextEmail,
				first_name: nextFirst ?? "",
				last_name: nextLast ?? "",
			});
			if (!result.ok) {
				setErrorMessage(translateAccountEditError(t, result.error));
				return;
			}

			if (password) {
				const passwordResult = await updateMyPassword(password);
				if (!passwordResult.ok) {
					setErrorMessage(t("common.auth.accountEdit.errorFallback"));
					return;
				}
			}

			onSuccess?.();
		} catch {
			setErrorMessage(t("common.auth.accountEdit.errorFallback"));
		} finally {
			setIsLoading(false);
		}
	};

	const formConfig: FormWrapperConfig = {
		formId: "account-edit-form",
		onSubmit: handleSubmit,
		submitLabel: isLoading
			? t("common.auth.accountEdit.submitting")
			: t("common.auth.accountEdit.submit"),
		submitDisabled: isLoading,
		showCancel: true,
		cancelLabel: t("common.cancel"),
		onCancel,
		deleteAction: {
			label: t("common.auth.accountEdit.deleteAction"),
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
						autoComplete: "name",
						label: t("common.auth.accountEdit.nameLabel"),
						type: "text",
						placeholder: t("common.auth.accountEdit.namePlaceholder"),
						required: true,
						disabled: isLoading,
					},
					{
						name: "email",
						autoComplete: "email",
						label: t("common.auth.accountEdit.emailLabel"),
						type: "email",
						placeholder: t("common.auth.accountEdit.emailPlaceholder"),
						required: true,
						disabled: isLoading,
					},
					{
						name: "password",
						autoComplete: "new-password",
						label: t("common.auth.accountEdit.passwordLabel"),
						type: "password",
						afterField: t("common.auth.accountEdit.passwordRequirements"),
						placeholder: t("common.auth.accountEdit.passwordPlaceholder"),
						disabled: isLoading,
						validators: [minLength(8, t("common.auth.validation.passwordMin"))],
					},
					{
						name: "confirmPassword",
						autoComplete: "new-password",
						label: t("common.auth.accountEdit.confirmPasswordLabel"),
						type: "password",
						placeholder: t(
							"common.auth.accountEdit.confirmPasswordPlaceholder",
						),
						disabled: isLoading,
						validators: [
							(value, formData) => {
								const passwordValue = String(formData.password ?? "");
								if (!passwordValue) return undefined;
								const confirmValue = String(value ?? "");
								if (confirmValue !== passwordValue) {
									return t("common.auth.validation.passwordMismatch");
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
			const deleteResult = await deleteUser(userId);
			if (!deleteResult.ok) {
				setErrorMessage(translateAccountEditError(t, deleteResult.error));
				return;
			}
			const logoutResult = await logout();
			if (logoutResult.ok) {
				await clearAccountStore();
			}
			router.replace(toLocalePath("/"));
			onSuccess?.();
		} catch (error) {
			setErrorMessage(
				error instanceof Error
					? error.message
					: t("common.auth.accountEdit.deleteError"),
			);
		} finally {
			setIsLoading(false);
			setShowDeleteConfirm(false);
		}
	};

	return (
		<div className="w-full md:max-w-3xl mx-auto">
			<div className="text-start font-bold mb-10">
				<h1 className="">{t("common.auth.accountEdit.title")}</h1>
			</div>

			<AlertDialog
				title={t("common.error")}
				status="error"
				description={errorMessage ?? ""}
				open={Boolean(errorMessage)}
				onOpenChange={(open) => {
					if (!open) {
						setErrorMessage(null);
					}
				}}
				confirmLabel={t("common.close")}
				onConfirm={() => setErrorMessage(null)}
			/>

			<AlertDialog
				status="warning"
				title={t("common.auth.accountEdit.deleteTitle")}
				description={t("common.auth.accountEdit.deleteDescription")}
				open={showDeleteConfirm}
				onOpenChange={(open) => setShowDeleteConfirm(open)}
				confirmLabel={t("common.auth.accountEdit.deleteConfirm")}
				cancelLabel={t("common.cancel")}
				onCancel={() => setShowDeleteConfirm(false)}
				onConfirm={handleDelete}
			/>

			<div className="flex-1 overflow-auto flex flex-col">
				<FormWrapper config={formConfig} />
			</div>
		</div>
	);
}
