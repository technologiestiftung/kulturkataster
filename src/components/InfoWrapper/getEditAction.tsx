"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import EditIcon from "@/icons/edit.svg";
import type { Institution } from "@/types";
import type { InfoWrapperEditConfig } from "./types";
import { cn } from "@/lib/utils";

type GetEditActionArgs = {
	edit?: InfoWrapperEditConfig;
	data: Partial<Institution>;
	defaultAriaLabel: string;
	className?: string;
};

export const getEditAction = ({
	edit,
	data,
	defaultAriaLabel,
	className,
}: GetEditActionArgs) => {
	if (!edit?.enabled) return null;

	const ariaLabel = edit.ariaLabel ?? edit.label ?? defaultAriaLabel;

	if (edit.href) {
		return (
			<Button
				type="button"
				variant="surface"
				iconSize="lg"
				radius="full"
				asChild
				className={cn(className, "bg-background")}
				aria-label={ariaLabel}
			>
				<Link href={edit.href}>
					<EditIcon className="size-4" />
				</Link>
			</Button>
		);
	}

	if (typeof edit.onClick === "function") {
		return (
			<Button
				type="button"
				variant="surface"
				iconSize="sm"
				radius={"full"}
				className={cn(className, "bg-background z-1")}
				onClick={() => edit.onClick?.(data as Institution)}
				aria-label={ariaLabel}
			>
				<EditIcon className="size-4" />
			</Button>
		);
	}

	return null;
};
