export type ImportIssueCode =
	| "emptyRequired"
	| "invalidNumber"
	| "invalidInteger"
	| "invalidDate"
	| "invalidOption"
	| "unknownCategory"
	| "unknownTag"
	| "unknownGroup"
	| "invalidValue"
	| "unknownId"
	| "duplicateId"
	| "columnCountMismatch";

export type ImportIssue = {
	row: number;
	column: string;
	code: ImportIssueCode;
};

export type InstitutionImportErrorCode =
	| "unauthorized"
	| "forbidden"
	| "invalidFile"
	| "fileTooLarge"
	| "emptyFile"
	| "unknownColumns"
	| "missingColumns"
	| "validationFailed"
	| "writeFailed"
	| "unexpected";

export type InstitutionImportResponse =
	| {
			ok: true;
			created: number;
			updated: number;
			unchanged: number;
	  }
	| {
			ok: false;
			error: InstitutionImportErrorCode;
			columns?: string[];
			issues?: ImportIssue[];
			issueCount?: number;
			created?: number;
			updated?: number;
	  };

export const INSTITUTION_IMPORT_ENDPOINT = "/api/institutions/import";
export const INSTITUTION_IMPORT_MAX_FILE_BYTES = 10 * 1024 * 1024;
