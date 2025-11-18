import * as React from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export interface ActionMenuItem {
	label: string;
	onClick: () => void;
	variant?: "default" | "destructive";
}

interface ActionMenuProps {
	items: ActionMenuItem[];
	align?: "start" | "end";
}

export function ActionMenu({ items, align = "end" }: ActionMenuProps) {
	return (
		<DropdownMenu modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="sm">
					<MoreVertical className="h-4 w-4" />
					<span className="sr-only">Open menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align={align}>
				{items.map((item, index) => (
					<DropdownMenuItem
						key={index}
						onSelect={() => item.onClick()}
						className={item.variant === "destructive" ? "text-destructive" : ""}
					>
						{item.label}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
