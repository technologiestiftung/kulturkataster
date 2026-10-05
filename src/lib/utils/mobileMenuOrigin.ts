// The mobile menu is an intercepted modal route, so its own URL says nothing
// about the page underneath. Remember that page when the menu opens, so the
// language toggle can switch the page the user actually returns to.
let origin: string | null = null;

export const rememberMobileMenuOrigin = (path: string) => {
	origin = path;
};

export const getMobileMenuOrigin = () => origin;
