import { get, set, del } from "idb-keyval";

export const idbStorage = {
	getItem: async (name: string) => {
		try {
			const value = await get(name);
			return value ?? null;
		} catch {
			return null;
		}
	},
	setItem: async (name: string, value: unknown) => {
		try {
			await set(name, value);
		} catch {
			// Ignore persistence errors (e.g. unsupported IndexedDB in tests).
		}
	},
	removeItem: async (name: string) => {
		try {
			await del(name);
		} catch {
			// Ignore persistence errors (e.g. unsupported IndexedDB in tests).
		}
	},
};
