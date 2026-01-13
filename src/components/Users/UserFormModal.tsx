"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormWrapper } from "@/components/FormWrapper";
import type { FormWrapperConfig } from "@/components/FormWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { useAccountStore } from "@/lib/store/accountStore";
import {
	createUser,
	getUserById,
	sendPasswordReset,
	updateUser,
} from "@/server/actions/users";
import type { UserStatus } from "@/generated/prisma";
import type { User } from "@/types/user";
import { ActionPanel } from "@/components/ActionPanel";

type UserFormModalProps = {
	mode: "create" | "edit";
	userId?: string;
};

const toNumberArray = (value: unknown): number[] => {
	if (!Array.isArray(value)) return [];
	return value
		.map((item) => Number(item))
		.filter((item) => Number.isFinite(item));
};

const toOptionalNumber = (value: unknown): number | undefined => {
	if (typeof value !== "string") return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : undefined;
};

export function UserFormModal({ mode, userId }: UserFormModalProps) {
	const router = useRouter();
	const { t } = useTranslation("content");
	const users = useAccountStore((state) => state.users);
	const roles = useAccountStore((state) => state.roles);
	const groups = useAccountStore((state) => state.groups);
	const institutions = useAccountStore((state) => state.institutions);
	const [submitting, setSubmitting] = useState(false);
	const [fetchedUser, setFetchedUser] = useState<User | null>(null);
	const [isFetchingUser, setIsFetchingUser] = useState(false);
	const [hasFetchedUser, setHasFetchedUser] = useState(false);

	const user = useMemo<User | undefined>(() => {
		if (mode !== "edit" || !userId) return undefined;
		return users.find((item) => item.id === userId);
	}, [mode, userId, users]);

	const resolvedUser = user ?? fetchedUser ?? undefined;
	const isWaitingForUser =
		mode === "edit" && !resolvedUser && (isFetchingUser || !hasFetchedUser);
	const showNotFound = mode === "edit" && !isWaitingForUser && !resolvedUser;

	const statusOptions = useMemo(
		() => [
			{
				value: "approval_pending",
				label: t("userFormModal.status.approvalPending"),
			},
			{ value: "active", label: t("userFormModal.status.active") },
			{ value: "inactive", label: t("userFormModal.status.inactive") },
			{ value: "banned", label: t("userFormModal.status.banned") },
		],
		[t],
	);

	const handleClose = () => {
		router.back();
	};

	useEffect(() => {
		if (mode !== "edit" || !userId || user || hasFetchedUser) return;

		let isMounted = true;
		setIsFetchingUser(true);
		void getUserById(userId)
			.then((result) => {
				if (!isMounted) return;
				setFetchedUser(result ?? null);
			})
			.catch(() => {
				if (!isMounted) return;
				setFetchedUser(null);
			})
			.finally(() => {
				if (!isMounted) return;
				setHasFetchedUser(true);
				setIsFetchingUser(false);
			});

		return () => {
			isMounted = false;
		};
	}, [mode, userId, user, hasFetchedUser]);

	const handleSubmit = async (data: Record<string, unknown>) => {
		if (submitting) return;
		setSubmitting(true);

		const groupIds = toNumberArray(data.groupIds);
		const institutionIds = toNumberArray(data.institutionIds);
		const roleId = toOptionalNumber(data.roleId);
		const status = (data.status || undefined) as UserStatus | undefined;

		try {
			if (mode === "create") {
				await createUser({
					email: String(data.email ?? ""),
					first_name: String(data.first_name ?? ""),
					last_name: String(data.last_name ?? ""),
					status,
					compliance: Boolean(data.compliance),
					account_type:
						typeof data.account_type === "string"
							? data.account_type
							: undefined,
					roleId,
					groupIds: groupIds.length > 0 ? groupIds : undefined,
					institutionIds:
						institutionIds.length > 0 ? institutionIds : undefined,
				});
			} else if (userId) {
				await updateUser({
					id: userId,
					email: String(data.email ?? ""),
					first_name: String(data.first_name ?? ""),
					last_name: String(data.last_name ?? ""),
					status,
					compliance: Boolean(data.compliance),
					account_type:
						typeof data.account_type === "string"
							? data.account_type
							: undefined,
					roleId,
					groupIds,
					institutionIds,
				});
			}

			router.refresh();
			handleClose();
		} finally {
			setSubmitting(false);
		}
	};

	const formConfig: FormWrapperConfig = {
		sections: [
			{
				id: "identity",
				title: t("userFormModal.form.identity.title"),
				description:
					mode === "create"
						? t("userFormModal.form.identity.description.create")
						: t("userFormModal.form.identity.description.edit"),
				fields: [
					{
						name: "email",
						label: t("userFormModal.form.identity.fields.email.label"),
						type: "email",
						required: true,
						placeholder: t(
							"userFormModal.form.identity.fields.email.placeholder",
						),
						gridColumn: "full",
					},
					{
						name: "first_name",
						label: t("userFormModal.form.identity.fields.firstName.label"),
						type: "text",
						placeholder: t(
							"userFormModal.form.identity.fields.firstName.placeholder",
						),
						gridColumn: "full",
					},
					{
						name: "last_name",
						label: t("userFormModal.form.identity.fields.lastName.label"),
						type: "text",
						placeholder: t(
							"userFormModal.form.identity.fields.lastName.placeholder",
						),
						gridColumn: "full",
					},
					{
						name: "status",
						label: t("userFormModal.form.identity.fields.status.label"),
						type: "select",
						options: statusOptions,
					},
					{
						name: "account_type",
						label: t("userFormModal.form.identity.fields.accountType.label"),
						type: "text",
						placeholder: t(
							"userFormModal.form.identity.fields.accountType.placeholder",
						),
					},
					{
						name: "compliance",
						label: t("userFormModal.form.identity.fields.compliance.label"),
						type: "switch",
						gridColumn: "full",
					},
				],
			},
			{
				id: "access",
				title: t("userFormModal.form.access.title"),
				fields: [
					{
						name: "roleId",
						label: t("userFormModal.form.access.fields.role.label"),
						type: "select",
						options: roles.map((role) => ({
							value: String(role.id),
							label: role.name,
						})),
					},
					{
						name: "groupIds",
						label: t("userFormModal.form.access.fields.groups.label"),
						type: "multiselect",
						options: groups.map((group) => ({
							value: String(group.id),
							label: group.name,
						})),
						gridColumn: "full",
					},
					{
						name: "institutionIds",
						label: t("userFormModal.form.access.fields.institutions.label"),
						type: "multiselect",
						options: institutions.map((institution) => ({
							value: String(institution.id),
							label: institution.name,
						})),
						gridColumn: "full",
					},
				],
			},
		],
		gridColumns: 2,
		onSubmit: handleSubmit,
		showCancel: true,
		cancelLabel: t("userFormModal.actions.cancel"),
		onCancel: handleClose,
		submitLabel: (() => {
			if (submitting) {
				return mode === "create"
					? t("userFormModal.actions.creating")
					: t("userFormModal.actions.saving");
			}
			return mode === "create"
				? t("userFormModal.actions.create")
				: t("userFormModal.actions.save");
		})(),
		initialValues: {
			email: resolvedUser?.email ?? "",
			first_name: resolvedUser?.first_name ?? "",
			last_name: resolvedUser?.last_name ?? "",
			status: resolvedUser?.status ?? "approval_pending",
			account_type: resolvedUser?.account_type ?? "",
			compliance: resolvedUser?.compliance ?? false,
			roleId: resolvedUser?.role?.id ? String(resolvedUser.role.id) : "",
			groupIds: resolvedUser?.groups?.map((group) => String(group.id)) ?? [],
			institutionIds:
				resolvedUser?.institutions?.map((institution) =>
					String(institution.id),
				) ?? [],
		},
	};

	if (showNotFound) {
		return (
			<Dialog open>
				<DialogContent variant="fullScreenNoBottom" className="p-0">
					<div className="flex h-full flex-col">
						<div className="border-b px-6 py-5 md:px-10">
							<DialogTitle className="text-2xl font-semibold">
								{t("userFormModal.dialog.notFound.title")}
							</DialogTitle>
						</div>
						<div className="flex-1 overflow-auto px-6 py-6 md:px-10">
							<p className="text-muted-foreground">
								{t("userFormModal.dialog.notFound.description")}
							</p>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Dialog open>
			<DialogContent variant="entityEdit" hideBackIcon={true} className="p-0">
				<div className="flex h-full flex-col">
					<div className="px-6 py-8 md:px-10">
						<DialogTitle className="text-2xl font-semibold">
							{mode === "create"
								? t("userFormModal.dialog.title.create")
								: t("userFormModal.dialog.title.edit")}
						</DialogTitle>
					</div>
					<div className="flex-1 overflow-auto px-6 py-6 md:px-10">
						{isWaitingForUser ? (
							<p className="text-muted-foreground">
								{t("userFormModal.dialog.loading")}
							</p>
						) : (
							<Card variant="secondary">
								<CardContent>
									<FormWrapper
										key={resolvedUser?.id ?? mode}
										config={formConfig}
									/>
									{mode === "edit" && resolvedUser && (
										<ActionPanel
											title={t("userFormModal.passwordReset.title")}
											description={t("userFormModal.passwordReset.description")}
											actionLabel={t("userFormModal.passwordReset.send")}
											actionLabelLoading={t(
												"userFormModal.passwordReset.sending",
											)}
											errorFallback={t("userFormModal.passwordReset.error")}
											onAction={async () => {
												await sendPasswordReset(resolvedUser.email);
												return t("userFormModal.passwordReset.success");
											}}
											className="mt-6"
										/>
									)}
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
