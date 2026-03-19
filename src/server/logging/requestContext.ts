import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";

export const REQUEST_ID_HEADER = "x-request-id";
export const REQUEST_METHOD_HEADER = "x-request-method";
export const REQUEST_PATHNAME_HEADER = "x-request-pathname";

type HeaderReader = Pick<Headers, "get">;

export type RequestContext = {
	requestId: string;
	method?: string;
	pathname?: string;
	route?: string;
	userId?: string | null;
};

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

function readHeaderValue(headersSource: HeaderReader, name: string) {
	const value = headersSource.get(name);
	return value && value.trim().length > 0 ? value : undefined;
}

export function getRequestContext(): RequestContext | undefined {
	return requestContextStorage.getStore();
}

export function setRequestContext(values: Partial<RequestContext>) {
	const current = getRequestContext();
	if (!current) return;

	requestContextStorage.enterWith({
		...current,
		...values,
	});
}

export function runWithRequestContext<T>(
	context: RequestContext,
	callback: () => Promise<T>,
): Promise<T> {
	return requestContextStorage.run(context, callback);
}

export function getRequestIdFromHeaders(headersSource: HeaderReader) {
	return readHeaderValue(headersSource, REQUEST_ID_HEADER) || randomUUID();
}

export function buildForwardedRequestHeaders(
	inputHeaders: Headers,
	overrides: Partial<RequestContext> = {},
) {
	const forwardedHeaders = new Headers(inputHeaders);
	const requestId =
		overrides.requestId || getRequestIdFromHeaders(forwardedHeaders);
	const method =
		overrides.method ||
		readHeaderValue(forwardedHeaders, REQUEST_METHOD_HEADER);
	const pathname =
		overrides.pathname ||
		readHeaderValue(forwardedHeaders, REQUEST_PATHNAME_HEADER);

	forwardedHeaders.set(REQUEST_ID_HEADER, requestId);

	if (method) {
		forwardedHeaders.set(REQUEST_METHOD_HEADER, method);
	}

	if (pathname) {
		forwardedHeaders.set(REQUEST_PATHNAME_HEADER, pathname);
	}

	return forwardedHeaders;
}

export async function runWithServerRequestContext<T>(
	callback: () => Promise<T>,
	overrides: Partial<RequestContext> = {},
): Promise<T> {
	const requestHeaders = await headers();

	return runWithRequestContext(
		{
			requestId: overrides.requestId || getRequestIdFromHeaders(requestHeaders),
			method:
				overrides.method ||
				readHeaderValue(requestHeaders, REQUEST_METHOD_HEADER),
			pathname:
				overrides.pathname ||
				readHeaderValue(requestHeaders, REQUEST_PATHNAME_HEADER),
			route: overrides.route,
			userId: overrides.userId,
		},
		callback,
	);
}

export function runWithNextRequestContext<T>(
	request: NextRequest,
	callback: () => Promise<T>,
	overrides: Partial<RequestContext> = {},
): Promise<T> {
	return runWithRequestContext(
		{
			requestId:
				overrides.requestId || getRequestIdFromHeaders(request.headers),
			method: overrides.method || request.method,
			pathname: overrides.pathname || request.nextUrl.pathname,
			route: overrides.route,
			userId: overrides.userId,
		},
		callback,
	);
}
