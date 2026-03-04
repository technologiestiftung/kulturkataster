import { AsyncLocalStorage } from "node:async_hooks";

export type AuditContext = {
	correlationId: string;
	rootEntityType: "submission";
	rootEntityId: string;
	actorUserId?: string | null;
	intent:
		| "submission_review_approved"
		| "submission_review_rejected"
		| "submission_review_completed";
};

const auditContextStorage = new AsyncLocalStorage<AuditContext>();

export function runWithAuditContext<T>(
	context: AuditContext,
	callback: () => Promise<T>,
): Promise<T> {
	return auditContextStorage.run(context, callback);
}

export function getAuditContext(): AuditContext | undefined {
	return auditContextStorage.getStore();
}
