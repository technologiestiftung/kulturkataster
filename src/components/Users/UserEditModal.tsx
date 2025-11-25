/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { SearchableSelectOption } from "@/components/shared/SearchableSelect";
import { Switch } from "@/components/ui/switch";
import type { User, AccessType } from "./types";
import { UserAccessDetails } from "./UserAccessDetails";
import { formatLastActivity } from "./utils";
import { GroupSelector } from "./GroupSelector";
import { InstitutionSelector } from "./InstitutionSelector";
import { searchInstitutions } from "@/lib/serverActions/institutions";
import { getInstitutionsGeoJSON } from "@/lib/serverActions/institutions";
import type { Feature, Geometry } from "geojson";

interface InstitutionProperties {
	id?: string | number;
	slug?: string;
	institution_id?: string | number;
	name?: string;
	title?: string;
	address?: string;
	city?: string;
	district?: string;
}

interface InstitutionSearchResult {
	id?: string | number;
	institution_id?: string | number;
	slug?: string;
	name?: string;
	title?: string;
	address?: string;
	city?: string;
}

type InstitutionFeature = Feature<Geometry | null, InstitutionProperties>;

interface UserEditModalProps {
	user: User | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (user: User) => void;
	onDelete: (userId: string) => void;
	onResendEmail: (userId: string) => void;
	onResetPassword: (userId: string) => void;
	onResendCompliance: (userId: string) => void;
}

export function UserEditModal({
	user,
	open,
	onOpenChange,
	onSave,
	onDelete,
	onResendEmail,
	onResetPassword,
	onResendCompliance,
}: UserEditModalProps) {
	const [editedUser, setEditedUser] = useState<User | null>(user);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [institutionOptions, setInstitutionOptions] = useState<
		SearchableSelectOption[]
	>([]);
	const restorePointerEvents = () => {
		if (typeof document === "undefined") return;
		if (document.body.style.pointerEvents === "none") {
			document.body.style.pointerEvents = "";
		}
	};

	useEffect(() => {
		if (open) {
			setEditedUser(user);
			if (user?.access.customInstitutions?.length) {
				setInstitutionOptions(
					user.access.customInstitutions.map((inst) => ({
						value: inst.id,
						label: inst.name,
					})),
				);
			}
		} else {
			setEditedUser(null);
			restorePointerEvents();
			setInstitutionOptions([]);
		}
		setShowDeleteConfirm(false);
	}, [user, open]);

	useEffect(() => {
		if (!open) return;
		const loadFallbackInstitutions = async () => {
			const geojson = await getInstitutionsGeoJSON().catch(() => null);
			if (geojson && "features" in geojson && Array.isArray(geojson.features)) {
				const options: SearchableSelectOption[] = (
					geojson.features as InstitutionFeature[]
				).map((feature) => ({
					value: String(
						feature.id ||
							feature.properties?.id ||
							feature.properties?.slug ||
							feature.properties?.institution_id ||
							"",
					),
					label:
						feature.properties?.name ||
						feature.properties?.title ||
						"Institution",
					description:
						feature.properties?.address ||
						feature.properties?.city ||
						feature.properties?.district ||
						"",
				}));
				setInstitutionOptions((prev) =>
					prev.length > 0 ? prev : options.slice(0, 100),
				);
			}
		};
		loadFallbackInstitutions();
	}, [open]);

	useEffect(() => {
		return () => {
			restorePointerEvents();
		};
	}, []);

	const handleSave = () => {
		if (!editedUser) return;
		onSave(editedUser);
		onOpenChange(false);
	};

	const handleDelete = () => {
		if (!editedUser) return;
		onDelete(editedUser.id);
		onOpenChange(false);
	};

	const handleResend = () => {
		if (!editedUser) return;
		onResendEmail(editedUser.id);
	};

	const handleResetPassword = () => {
		if (!editedUser) return;
		onResetPassword(editedUser.id);
	};

	const toggleCompliance = () => {
		if (!editedUser) return;
		setEditedUser({
			...editedUser,
			complianceAccepted: !editedUser.complianceAccepted,
		});
	};

	const handleInstitutionSearch = async (term: string) => {
		if (!term.trim()) {
			setInstitutionOptions([]);
			return;
		}
		try {
			const results = await searchInstitutions(term);
			const options: SearchableSelectOption[] = (results || []).map(
				(inst: InstitutionSearchResult) => ({
					value: String(inst.id ?? inst.institution_id ?? inst.slug ?? ""),
					label: inst.name || inst.title || "Institution",
					description: inst.address || inst.city || "",
				}),
			);
			setInstitutionOptions(options);
		} catch (error) {
			console.error("Institution search failed", error);
			setInstitutionOptions([]);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-2xl font-bold">Edit User</DialogTitle>
					<DialogDescription>
						Make changes to the user account details below.
					</DialogDescription>
				</DialogHeader>

				{editedUser ? (
					<div className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={editedUser.name}
									onChange={(e) =>
										setEditedUser({ ...editedUser, name: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={editedUser.email}
									onChange={(e) =>
										setEditedUser({ ...editedUser, email: e.target.value })
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="role">Role</Label>
								<select
									id="role"
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									value={editedUser.role}
									onChange={(e) =>
										setEditedUser({
											...editedUser,
											role: e.target.value as User["role"],
										})
									}
								>
									<option value="admin">Administrator</option>
									<option value="publisher">Herausgeber</option>
									<option value="redaktion">Redaktion</option>
									<option value="editor">Bearbeiter</option>
									<option value="contributor">Mitwirkender</option>
									<option value="viewer">Betrachter</option>
								</select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="status">Status</Label>
								<select
									id="status"
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									value={editedUser.status}
									onChange={(e) =>
										setEditedUser({
											...editedUser,
											status: e.target.value as User["status"],
										})
									}
								>
									<option value="active">Active</option>
									<option value="inactive">Inactive</option>
									<option value="pending">Pending</option>
								</select>
							</div>
						</div>

						<div className="flex items-center justify-between rounded-md border p-3">
							<div className="space-y-1">
								<Label>Compliance accepted</Label>
								<p className="text-xs text-muted-foreground">
									Track whether the user acknowledged the compliance policy.
								</p>
							</div>
							<Switch
								checked={!!editedUser.complianceAccepted}
								onCheckedChange={toggleCompliance}
							/>
						</div>

						<div className="space-y-2">
							<Label>Gruppen (Groups)</Label>
							<GroupSelector
								selectedGroups={editedUser.groups}
								onChange={(groups) => setEditedUser({ ...editedUser, groups })}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="accessType">Institution Access</Label>
							<select
								id="accessType"
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								value={editedUser.access.type}
								onChange={(e) => {
									const newType = e.target.value as AccessType;
									setEditedUser({
										...editedUser,
										access:
											newType === "custom"
												? {
														type: "custom",
														source: "individual-override",
														customInstitutions: [],
														institutionCount: 0,
													}
												: {
														type: "inherit",
														source: "group-inherited",
														institutionCount:
															editedUser.groups.length > 0 ? 234 : 0,
													},
									});
								}}
							>
								<option value="inherit">
									Von Gruppe erben (Inherit from Groups)
								</option>
								<option value="custom">Benutzerdefiniert (Custom)</option>
							</select>

							{editedUser.access.type === "inherit" && (
								<div className="p-3 bg-muted/50 rounded-md text-sm">
									<p className="text-muted-foreground mb-2">
										User will inherit access from all assigned groups.
									</p>
									<p className="text-xs text-muted-foreground">
										Manage groups above to control institution access.
									</p>
								</div>
							)}

							{editedUser.access.type === "custom" && (
								<div className="space-y-2">
									<Label className="text-sm text-muted-foreground">
										Select Institutions
									</Label>
									<InstitutionSelector
										selectedInstitutions={
											editedUser.access.customInstitutions || []
										}
										onChange={(institutions) =>
											setEditedUser({
												...editedUser,
												access: {
													...editedUser.access,
													customInstitutions: institutions,
													institutionCount: institutions.length,
												},
											})
										}
										options={institutionOptions}
										onSearch={handleInstitutionSearch}
									/>
									<p className="text-xs text-muted-foreground mt-2">
										Custom institutions can be added on top of group access
										(mixed mode) or replace it entirely (individual override).
									</p>
								</div>
							)}

							<div className="p-3 bg-muted rounded-md text-sm">
								<div className="flex items-center gap-2">
									<span className="text-muted-foreground">
										Current: {editedUser.access.institutionCount} institutions
									</span>
								</div>
								<UserAccessDetails access={editedUser.access} />
							</div>
						</div>

						<div className="space-y-2">
							<Label>Last Activity</Label>
							<div className="p-3 bg-muted rounded-md space-y-1">
								<div className="text-sm font-medium">
									{formatLastActivity(editedUser.lastActivity)}
								</div>
								<div className="text-xs text-muted-foreground">
									{editedUser.lastActivity.toLocaleString("de-DE", {
										weekday: "long",
										year: "numeric",
										month: "long",
										day: "numeric",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
							</div>
						</div>
					</div>
				) : (
					<div className="py-8 text-center text-sm text-muted-foreground">
						Select a user to edit.
					</div>
				)}

				<DialogFooter className="flex flex-wrap gap-2">
					{editedUser ? (
						<>
							<div className="flex  gap-2">
								<Button
									type="button"
									variant="secondary"
									onClick={handleResend}
									disabled={!editedUser}
								>
									Resend Invitation
								</Button>
								<Button
									type="button"
									variant="secondary"
									onClick={handleResetPassword}
									disabled={!editedUser}
								>
									Reset Password
								</Button>
								<Button
									type="button"
									variant="secondary"
									onClick={() =>
										editedUser && onResendCompliance(editedUser.id)
									}
									disabled={!editedUser}
								>
									Resend Compliance
								</Button>
							</div>
							<div className="flex gap-2">
								{!showDeleteConfirm ? (
									<Button
										type="button"
										variant="destructive"
										onClick={() => setShowDeleteConfirm(true)}
									>
										Delete User
									</Button>
								) : (
									<div className="flex gap-2">
										<Button
											type="button"
											variant="destructive"
											onClick={handleDelete}
										>
											Confirm Delete
										</Button>
										<Button
											type="button"
											variant="outline"
											onClick={() => setShowDeleteConfirm(false)}
										>
											Cancel
										</Button>
									</div>
								)}
							</div>
						</>
					) : (
						<div />
					)}
					<div className="flex gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="button" onClick={handleSave} disabled={!editedUser}>
							Save Changes
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
