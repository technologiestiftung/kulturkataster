import { FC, ReactNode, useCallback, useEffect } from "react";
import { useMapControl } from "../hooks/useMapControl";

interface BaseControlProps {
	icon: ReactNode;
	title: string;
	onClick: () => void;
	className?: string;
	position?: {
		bottom?: string;
		right?: string;
		top?: string;
		left?: string;
	};
}

const BaseControl: FC<BaseControlProps> = ({
	icon,
	title,
	onClick,
	className,
	position,
}) => {
	const { renderButton } = useMapControl({ className, position });

	const handleClick = useCallback(() => {
		onClick();
	}, [onClick]);

	useEffect(() => {
		if (renderButton) {
			renderButton(icon, handleClick, title);
		}
	}, [renderButton, icon, handleClick, title]);

	return null;
};

export default BaseControl;
