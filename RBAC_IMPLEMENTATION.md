# RBAC Implementation Guide for Kulturkataster

## Overview

This document outlines the recommended approach for implementing the Role-Based Access Control (RBAC) system using Supabase RLS (Row Level Security) and server actions.

## Architecture Decision

### What to Handle with Supabase RLS

- ✅ **Institution Read Access** - Filter which institutions users can view based on group membership
- ✅ **User Management Read Access** - Control who can see which users
- ✅ **Group Membership** - Restrict access to groups users belong to
- ✅ **Basic CRUD Operations** - Standard create, read, update, delete based on role permissions

### What to Handle with Server Actions

- ✅ **Field-Level Permissions** - Complex permission checks for individual fields (view, requestChange, approveChange)
- ✅ **Status Change Workflows** - Archive, unarchive, publish, unpublish logic
- ✅ **Deletion Workflows** - Request deletion, approve deletion (requires workflow state)
- ✅ **Change Request System** - Proposed changes that need approval
- ✅ **Scope Restriction Logic** - "Nur eigene Gruppe" - complex group-based filtering
- ✅ **Permission Validation** - Centralized permission checking before operations

### Why This Split?

**RLS for Simple Access Control:**

- Native database-level security
- Fast performance (happens at query time)
- Automatic enforcement (can't be bypassed)
- Good for: "Can user X see institution Y?"

**Server Actions for Complex Business Logic:**

- Flexible workflow implementation
- Easier to maintain and test
- Better error handling and validation
- Good for: "Can user X edit field Y of institution Z and does it need approval?"

---

## Database Schema

### Core Tables

```sql
-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  scope_restriction BOOLEAN NOT NULL DEFAULT false,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id),
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  institution_access JSONB NOT NULL DEFAULT '{"type": "all"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Group membership (many-to-many)
CREATE TABLE user_groups (
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

-- Institutions table
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, archived
  district TEXT,
  category TEXT,
  -- ... all other institution fields
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Change requests table (for approval workflow)
CREATE TABLE change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES user_profiles(id),
  change_type TEXT NOT NULL, -- 'field_change', 'status_change', 'deletion'
  field_name TEXT, -- for field changes
  current_value JSONB,
  proposed_value JSONB,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Permissions JSONB Structure

```typescript
interface RolePermissions {
	fields: {
		[fieldName: string]: {
			view: boolean;
			requestChange: boolean;
			approveChange: boolean;
		};
	};
	createInstitution: boolean;
	publishInstitution: boolean;
	changeStatus: boolean;
	deleteInstitution: boolean;
	manageUsers: boolean;
	manageGroups: boolean;
}
```

---

## Supabase RLS Policies

### Institution Read Access

```sql
-- Policy: Users can read institutions based on their group access
CREATE POLICY "Users can read accessible institutions"
ON institutions
FOR SELECT
USING (
  -- Check if user has access through their groups
  EXISTS (
    SELECT 1
    FROM user_groups ug
    JOIN groups g ON g.id = ug.group_id
    WHERE ug.user_id = auth.uid()
    AND (
      -- Group has access to all institutions
      (g.institution_access->>'type' = 'all')
      OR
      -- Group has district-based access
      (g.institution_access->>'type' = 'district'
       AND institutions.district = ANY(
         SELECT jsonb_array_elements_text(g.institution_access->'districts')
       ))
      OR
      -- Group has category-based access
      (g.institution_access->>'type' = 'category'
       AND institutions.category = ANY(
         SELECT jsonb_array_elements_text(g.institution_access->'categories')
       ))
      OR
      -- Group has custom institution access
      (g.institution_access->>'type' = 'custom'
       AND institutions.id::text = ANY(
         SELECT jsonb_array_elements_text(g.institution_access->'institutions')
       ))
    )
  )
);
```

### User Management Access

```sql
-- Policy: Users can read other users based on role permissions
CREATE POLICY "Users can read users they can manage"
ON user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    WHERE up.id = auth.uid()
    AND (r.permissions->>'manageUsers')::boolean = true
    AND (
      -- If no scope restriction, can see all users
      r.scope_restriction = false
      OR
      -- If scope restriction, only users in same groups
      EXISTS (
        SELECT 1
        FROM user_groups ug1
        JOIN user_groups ug2 ON ug1.group_id = ug2.group_id
        WHERE ug1.user_id = auth.uid()
        AND ug2.user_id = user_profiles.id
      )
    )
  )
  OR user_profiles.id = auth.uid() -- Users can always see themselves
);
```

### Basic Institution Modification

```sql
-- Policy: Users can update institutions if they have appropriate permissions
CREATE POLICY "Users can update accessible institutions"
ON institutions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN roles r ON r.id = up.role_id
    JOIN user_groups ug ON ug.user_id = up.id
    JOIN groups g ON g.id = ug.group_id
    WHERE up.id = auth.uid()
    AND (
      -- Has approve change permission (can edit directly)
      (r.permissions->'fields'->>'approveChange')::boolean = true
    )
    AND (
      -- Check group-based institution access
      (g.institution_access->>'type' = 'all')
      OR (g.institution_access->>'type' = 'district'
          AND institutions.district = ANY(SELECT jsonb_array_elements_text(g.institution_access->'districts')))
      OR (g.institution_access->>'type' = 'category'
          AND institutions.category = ANY(SELECT jsonb_array_elements_text(g.institution_access->'categories')))
      OR (g.institution_access->>'type' = 'custom'
          AND institutions.id::text = ANY(SELECT jsonb_array_elements_text(g.institution_access->'institutions')))
    )
    AND (
      -- Check scope restriction
      r.scope_restriction = false
      OR ug.group_id IN (
        SELECT group_id FROM user_groups WHERE user_id = auth.uid()
      )
    )
  )
);
```

---

## Server Actions Implementation

### Permission Checking Utility

```typescript
// lib/permissions.ts
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserPermissions() {
	const supabase = await createClient();

	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) throw new Error("Unauthorized");

	const { data: profile } = await supabase
		.from("user_profiles")
		.select("*, role:roles(*), groups:user_groups(group:groups(*))")
		.eq("id", user.id)
		.single();

	if (!profile?.role) throw new Error("User has no role assigned");

	return {
		userId: user.id,
		role: profile.role,
		permissions: profile.role.permissions as RolePermissions,
		scopeRestriction: profile.role.scope_restriction,
		groups: profile.groups.map((ug) => ug.group),
	};
}

export async function canUserAccessInstitution(
	institutionId: string,
	userId: string,
	groups: any[],
): Promise<boolean> {
	const supabase = await createClient();

	const { data: institution } = await supabase
		.from("institutions")
		.select("*")
		.eq("id", institutionId)
		.single();

	if (!institution) return false;

	// Check if any of user's groups grant access
	return groups.some((group) => {
		const access = group.institution_access;

		if (access.type === "all") return true;

		if (access.type === "district") {
			return access.districts?.some((d: any) => d.key === institution.district);
		}

		if (access.type === "category") {
			return access.categories?.some(
				(c: any) => c.key === institution.category,
			);
		}

		if (access.type === "custom") {
			return access.institutions?.some((i: any) => i.id === institutionId);
		}

		return false;
	});
}

export async function canUserEditField(
	fieldName: string,
	permissions: RolePermissions,
): Promise<{ canEdit: boolean; needsApproval: boolean }> {
	const fieldPerms = permissions.fields[fieldName];

	if (!fieldPerms) return { canEdit: false, needsApproval: false };

	// Can edit directly if has approveChange permission
	if (fieldPerms.approveChange) {
		return { canEdit: true, needsApproval: false };
	}

	// Can propose change if has requestChange permission
	if (fieldPerms.requestChange) {
		return { canEdit: true, needsApproval: true };
	}

	return { canEdit: false, needsApproval: false };
}
```

### Field Update Server Action

```typescript
// actions/institutions.ts
"use server";

import { revalidatePath } from "next/cache";
import {
	getCurrentUserPermissions,
	canUserAccessInstitution,
	canUserEditField,
} from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export async function updateInstitutionField(
	institutionId: string,
	fieldName: string,
	newValue: any,
) {
	const supabase = await createClient();
	const userPerms = await getCurrentUserPermissions();

	// Check if user has access to this institution
	const hasAccess = await canUserAccessInstitution(
		institutionId,
		userPerms.userId,
		userPerms.groups,
	);

	if (!hasAccess) {
		return { error: "No access to this institution" };
	}

	// Check field-level permissions
	const { canEdit, needsApproval } = await canUserEditField(
		fieldName,
		userPerms.permissions,
	);

	if (!canEdit) {
		return { error: `No permission to edit field: ${fieldName}` };
	}

	if (needsApproval) {
		// Create change request instead of direct update
		const { data: currentInstitution } = await supabase
			.from("institutions")
			.select(fieldName)
			.eq("id", institutionId)
			.single();

		const { error } = await supabase.from("change_requests").insert({
			institution_id: institutionId,
			requested_by: userPerms.userId,
			change_type: "field_change",
			field_name: fieldName,
			current_value: currentInstitution?.[fieldName],
			proposed_value: newValue,
			status: "pending",
		});

		if (error) return { error: error.message };

		revalidatePath(`/institutions/${institutionId}`);
		return { success: true, needsApproval: true };
	}

	// Direct update (has approveChange permission)
	const { error } = await supabase
		.from("institutions")
		.update({ [fieldName]: newValue, updated_at: new Date().toISOString() })
		.eq("id", institutionId);

	if (error) return { error: error.message };

	revalidatePath(`/institutions/${institutionId}`);
	return { success: true, needsApproval: false };
}
```

### Status Change Server Action

```typescript
// actions/institutions.ts
export async function changeInstitutionStatus(
	institutionId: string,
	newStatus: "draft" | "published" | "archived",
) {
	const supabase = await createClient();
	const userPerms = await getCurrentUserPermissions();

	// Check institution access
	const hasAccess = await canUserAccessInstitution(
		institutionId,
		userPerms.userId,
		userPerms.groups,
	);

	if (!hasAccess) {
		return { error: "No access to this institution" };
	}

	// Check permission based on status change type
	if (newStatus === "published" && !userPerms.permissions.publishInstitution) {
		return { error: "No permission to publish institutions" };
	}

	if (
		(newStatus === "archived" || newStatus === "draft") &&
		!userPerms.permissions.changeStatus
	) {
		return { error: "No permission to change institution status" };
	}

	const { error } = await supabase
		.from("institutions")
		.update({ status: newStatus, updated_at: new Date().toISOString() })
		.eq("id", institutionId);

	if (error) return { error: error.message };

	revalidatePath(`/institutions/${institutionId}`);
	return { success: true };
}
```

### Deletion Workflow Server Action

```typescript
// actions/institutions.ts
export async function requestInstitutionDeletion(institutionId: string) {
	const supabase = await createClient();
	const userPerms = await getCurrentUserPermissions();

	if (!userPerms.permissions.changeStatus) {
		return { error: "No permission to request deletion" };
	}

	const hasAccess = await canUserAccessInstitution(
		institutionId,
		userPerms.userId,
		userPerms.groups,
	);

	if (!hasAccess) {
		return { error: "No access to this institution" };
	}

	const { error } = await supabase.from("change_requests").insert({
		institution_id: institutionId,
		requested_by: userPerms.userId,
		change_type: "deletion",
		status: "pending",
	});

	if (error) return { error: error.message };

	revalidatePath(`/institutions/${institutionId}`);
	return { success: true };
}

export async function approveInstitutionDeletion(changeRequestId: string) {
	const supabase = await createClient();
	const userPerms = await getCurrentUserPermissions();

	if (!userPerms.permissions.deleteInstitution) {
		return { error: "No permission to approve deletions" };
	}

	const { data: changeRequest } = await supabase
		.from("change_requests")
		.select("*, institution:institutions(*)")
		.eq("id", changeRequestId)
		.single();

	if (!changeRequest) {
		return { error: "Change request not found" };
	}

	// Delete the institution
	const { error: deleteError } = await supabase
		.from("institutions")
		.delete()
		.eq("id", changeRequest.institution_id);

	if (deleteError) return { error: deleteError.message };

	// Mark change request as approved
	await supabase
		.from("change_requests")
		.update({
			status: "approved",
			approved_by: userPerms.userId,
			updated_at: new Date().toISOString(),
		})
		.eq("id", changeRequestId);

	revalidatePath("/institutions");
	return { success: true };
}

export async function deleteInstitutionDirectly(institutionId: string) {
	const supabase = await createClient();
	const userPerms = await getCurrentUserPermissions();

	if (!userPerms.permissions.deleteInstitution) {
		return { error: "No permission to delete institutions" };
	}

	const hasAccess = await canUserAccessInstitution(
		institutionId,
		userPerms.userId,
		userPerms.groups,
	);

	if (!hasAccess) {
		return { error: "No access to this institution" };
	}

	const { error } = await supabase
		.from("institutions")
		.delete()
		.eq("id", institutionId);

	if (error) return { error: error.message };

	revalidatePath("/institutions");
	return { success: true };
}
```

---

## Best Practices

### 1. **Always Validate on Server**

Never trust client-side permission checks. Always re-validate permissions in server actions.

### 2. **Use RLS as Base Security Layer**

RLS ensures users can't access data they shouldn't, even if server action has bugs.

### 3. **Cache Permission Checks**

For frequently accessed permissions, consider caching role data in the session.

### 4. **Audit Logging**

Log all permission-sensitive operations:

```typescript
await supabase.from("audit_logs").insert({
	user_id: userPerms.userId,
	action: "update_institution",
	resource_type: "institution",
	resource_id: institutionId,
	details: { field: fieldName, old_value, new_value },
});
```

### 5. **Handle Scope Restriction Consistently**

Always apply scope restriction logic in both RLS and server actions.

### 6. **Test Permission Boundaries**

Write tests for edge cases:

- User with no groups
- User with multiple groups with conflicting access
- Scope restriction edge cases

### 7. **Performance Optimization**

- Index foreign keys (user_id, role_id, group_id)
- Use JSONB indexes for permission lookups
- Consider materializing frequently checked permissions

```sql
CREATE INDEX idx_roles_permissions ON roles USING GIN (permissions);
CREATE INDEX idx_groups_institution_access ON groups USING GIN (institution_access);
```

---

## Migration Path

### Phase 1: Setup Database

1. Create tables and RLS policies
2. Migrate existing roles to new structure
3. Create initial groups

### Phase 2: Implement Read Access

1. Apply RLS policies for read operations
2. Test institution filtering by groups
3. Test user management access

### Phase 3: Implement Write Operations

1. Create server actions for field updates
2. Implement change request workflow
3. Add status change logic

### Phase 4: Advanced Features

1. Implement deletion workflows
2. Add audit logging
3. Optimize performance

---

## Summary

**Use Supabase RLS for:**

- Institution read access (fast, automatic filtering)
- Basic CRUD authorization checks
- Group-based access control

**Use Server Actions for:**

- Field-level permission validation
- Change request workflows
- Status management
- Deletion approval flows
- Complex business logic

This hybrid approach gives you the security and performance of RLS while maintaining the flexibility to implement complex workflows that would be difficult or impossible to express in SQL policies alone.
