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
	// The unmatched list items, e.g. unknown tag names.
	values?: string[];
};

export type InstitutionImportErrorCode =
	| "unauthorized"
	| "forbidden"
	| "invalidFile"
	| "legacyExcelFile"
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
			// True when the file was only checked; counts are what an import would write.
			dryRun: boolean;
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

export const INSTITUTION_IMPORT_ACCEPT = [
	".csv",
	".xlsx",
	"text/csv",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");
export const INSTITUTION_IMPORT_ENDPOINT = "/api/institutions/import";
export const INSTITUTION_IMPORT_MAX_FILE_BYTES = 10 * 1024 * 1024;
