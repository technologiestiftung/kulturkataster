import { AsyncLocalStorage } from "async_hooks";
import { getCurrentUserId } from "@/server/auth/getCurrentUser";

type Context = {
	userId?: string;
};

export class ContextManager {
	private static storage = new AsyncLocalStorage<Context>();

	static run<T>(context: Context, callback: () => T): T {
		return this.storage.run(context, callback);
	}

	static get(): Context | undefined {
		return this.storage.getStore();
	}

	static getUserId(): string | undefined {
		return this.get()?.userId;
	}
}

export async function withAuditContext<T>(
	callback: () => Promise<T>,
): Promise<T> {
	const userId = await getCurrentUserId();
	return ContextManager.run({ userId: userId || undefined }, callback);
}
