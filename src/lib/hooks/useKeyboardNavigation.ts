import {
	Dispatch,
	KeyboardEvent,
	RefObject,
	SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";

interface UseKeyboardNavigationOptions {
	itemCount: number;
	onEnter?: (selectedIndex: number) => void;
	onEscape?: () => void;
	initialIndex?: number;
	wrapAround?: boolean;
}

interface UseKeyboardNavigationReturn {
	activeIndex: number;
	setActiveIndex: Dispatch<SetStateAction<number>>;
	isKeyboardNav: boolean;
	setIsKeyboardNav: Dispatch<SetStateAction<boolean>>;
	getItemProps: (index: number) => {
		onMouseEnter: () => void;
		"aria-selected": boolean;
		id: string;
	};
	handleKeyDown: (e: KeyboardEvent) => void;
	reset: () => void;
	listRef: RefObject<HTMLUListElement | null>;
}

export function useKeyboardNavigation({
	itemCount,
	onEnter,
	onEscape,
	initialIndex = -1,
	wrapAround = false,
}: UseKeyboardNavigationOptions): UseKeyboardNavigationReturn {
	const [activeIndex, setActiveIndex] = useState<number>(initialIndex);
	const [isKeyboardNav, setIsKeyboardNav] = useState<boolean>(false);
	const listRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		if (itemCount === 0) {
			setActiveIndex(-1);
		}
	}, [itemCount]);

	useEffect(() => {
		if (isKeyboardNav && activeIndex >= 0 && listRef.current) {
			const activeItem = listRef.current.children[activeIndex] as HTMLElement;
			if (activeItem) {
				activeItem.scrollIntoView({ block: "nearest" });
			}
		}
	}, [activeIndex, isKeyboardNav]);

	const handleKeyDown = (e: KeyboardEvent) => {
		if (itemCount === 0) return;

		setIsKeyboardNav(true);

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setActiveIndex((prev) => {
					if (prev >= itemCount - 1) {
						return wrapAround ? 0 : prev;
					}
					return prev + 1;
				});
				break;

			case "ArrowUp":
				e.preventDefault();
				setActiveIndex((prev) => {
					if (prev <= 0) {
						return wrapAround ? itemCount - 1 : prev;
					}
					return prev - 1;
				});
				break;

			case "Enter":
				e.preventDefault();
				if (activeIndex >= 0 && onEnter) {
					onEnter(activeIndex);
				}
				break;

			case "Escape":
				e.preventDefault();
				setActiveIndex(-1);
				if (onEscape) {
					onEscape();
				}
				break;

			default:
				break;
		}
	};

	const getItemProps = (index: number) => ({
		onMouseEnter: () => {
			setIsKeyboardNav(false);
			setActiveIndex(index);
		},
		"aria-selected": index === activeIndex,
		id: `keyboard-nav-item-${index}`,
	});

	const reset = () => {
		setActiveIndex(-1);
		setIsKeyboardNav(false);
	};

	return {
		activeIndex,
		setActiveIndex,
		isKeyboardNav,
		setIsKeyboardNav,
		getItemProps,
		handleKeyDown,
		reset,
		listRef,
	};
}
