"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export type EmptyActionStateAction = {
	label: ReactNode;
	icon?: ReactNode;
	href?: string;
	onClick?: () => void;
	disabled?: boolean;
};

type EmptyActionStateProps = {
	title: ReactNode;
	description?: ReactNode;
	actions?: EmptyActionStateAction[];
	className?: string;
};

export function EmptyActionState({
	title,
	description,
	actions = [],
	className,
}: EmptyActionStateProps) {
	const router = useRouter();

	return (
		<div
			className={`w-full flex h-full flex-col text-center items-center justify-center py-8 ${className ?? ""}`}
		>
			<p className="body1 font-bold">{title}</p>
			{description ? <p className="body1">{description}</p> : null}
			{actions.length > 0 ? (
				<div className="mt-10 flex justify-center gap-4">
					{actions.map((action, index) => (
						<Button
							key={index}
							variant="action"
							size="tile"
							disabled={action.disabled}
							onClick={() => {
								action.onClick?.();
								if (action.href) {
									router.push(action.href);
								}
							}}
						>
							{action.icon}
							<span className="text-wrap">{action.label}</span>
						</Button>
					))}
				</div>
			) : null}
		</div>
	);
}
