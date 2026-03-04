import { revalidatePath } from "next/cache";

export const revalidateAccount = () => {
	revalidatePath("/account", "layout");
};
