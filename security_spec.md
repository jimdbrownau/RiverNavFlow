# Firebase Security Specification & TDD Test Suite

## 1. Data Invariants

1. **User Data Isolation (Waypoints & Routes)**:
   - A user can only create, read, update, and delete waypoints and routes within their own user subcollections (`/users/{userId}/waypoints/*` and `/users/{userId}/routes/*`).
   - The `userId` property within incoming payloads must strictly match `request.auth.uid`.
   - Document IDs must conform to `isValidId` (`^[a-zA-Z0-9_\-]+$`, length <= 128).

2. **Fleet Vessel Telemetry Invariants**:
   - Any authenticated mariner can create or update their own telemetry record in `/fleet_vessels/{vesselId}` where `vesselId == request.auth.uid`.
   - Non-admin users cannot alter licensing flags (`downloadAccess`, `downloadQuotaMb`) on any vessel record.
   - Master Administrator (`jimdbrownau@gmail.com` or users with admin role) can read all vessels and update permissions.
   - Coordinates (`lat`, `lng`) must be valid finite numbers.

3. **Audit Log Invariants**:
   - Authenticated users can insert their own download operation logs into `/download_audit_logs/{logId}`.
   - Download audit logs are append-only; update and delete operations are strictly forbidden to maintain audit integrity.
   - Master Admin can read all audit logs.

4. **Default Deny**:
   - Any unspecified collection or path is rejected by the global `match /{document=**} { allow read, write: if false; }` catch-all.

---

## 2. The "Dirty Dozen" Malicious Payloads

1. **Payload 1 (Identity Spoofing - Waypoint Creation)**:
   - Attempt to create a waypoint under `/users/victim_123/waypoints/wp-1` with `userId: 'attacker_456'`.
   - Expected Result: `PERMISSION_DENIED` (Path user ID does not match auth UID).

2. **Payload 2 (Cross-User Waypoint Hijack)**:
   - Attacker authenticated as `user_B` writes into `/users/user_A/waypoints/wp-99`.
   - Expected Result: `PERMISSION_DENIED`.

3. **Payload 3 (Resource Exhaustion / 1MB String Injection)**:
   - Waypoint with `name` payload exceeding 100 characters or containing a 500KB string.
   - Expected Result: `PERMISSION_DENIED` (`name.size() <= 100`).

4. **Payload 4 (Ghost Field / Shadow Field Injection)**:
   - Waypoint payload containing unapproved field `__shadowRole: 'superuser'`.
   - Expected Result: `PERMISSION_DENIED` (`keys().hasOnly(...)`).

5. **Payload 5 (Unauthenticated Write)**:
   - Anonymous/unauthenticated client attempts to write into `/fleet_vessels/boat-1`.
   - Expected Result: `PERMISSION_DENIED` (`request.auth != null`).

6. **Payload 6 (Admin Privilege Self-Escalation on Fleet Vessel)**:
   - Standard user `usr-skipper-1` attempts to update `downloadAccess: 'granted'` and `downloadQuotaMb: 999999` on their own vessel document.
   - Expected Result: `PERMISSION_DENIED` (Only admin can change license status).

7. **Payload 7 (Audit Log Tampering / Mutation)**:
   - User attempts to `update` or `delete` an existing download audit entry in `/download_audit_logs/log-1`.
   - Expected Result: `PERMISSION_DENIED` (Audit logs are strictly write-once / append-only).

8. **Payload 8 (Invalid Coordinate Range Poisoning)**:
   - Vessel telemetry payload with `lat: 'NorthPole'` (invalid string type instead of float).
   - Expected Result: `PERMISSION_DENIED` (`lat is number`).

9. **Payload 9 (ID Poisoning Attack)**:
   - Request to document path `/users/test/waypoints/../../dangerous_path` or document ID longer than 128 characters.
   - Expected Result: `PERMISSION_DENIED` (`isValidId(id)`).

10. **Payload 10 (Route Overwrite by Non-Owner)**:
    - User attempting to delete another mariner's saved route `/users/user_alpha/routes/voyage-1`.
    - Expected Result: `PERMISSION_DENIED`.

11. **Payload 11 (Blanket Collection Scrape Attack)**:
    - Unauthenticated query to list all user documents across all collections.
    - Expected Result: `PERMISSION_DENIED`.

12. **Payload 12 (Audit Log Impersonation)**:
    - Attacker creating an audit log with `userId: 'victim_user'` to falsely attribute map downloads to someone else.
    - Expected Result: `PERMISSION_DENIED` (`incoming().userId == request.auth.uid`).
