import path from "node:path";

export const E2E_AUTH_DIR = path.join(process.cwd(), "tests/e2e/.auth");
export const USER_STORAGE_STATE = path.join(E2E_AUTH_DIR, "user.json");
export const ADMIN_STORAGE_STATE = path.join(E2E_AUTH_DIR, "admin.json");
