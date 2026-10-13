# Changelog - Enzyme Fee Calculator

## [Unreleased] - Recent Updates

### Added
- **Phase Settings Modal**: Added a new rich editing modal for Project Phases, allowing you to define Tasks, Deliverables, Inclusions, and Omissions directly within templates and projects.
- **Document Builder Sidebar**: Implemented a dual-pane sidebar splitting Project Proposals (top) and a Saved Templates Library (bottom).
- **Template Drag & Drop**: Templates from the sidebar library can now be dragged directly into the Document Builder canvas.
- **Reset to Budget**: Added a button to the Gantt Planner to delete manually adjusted tasks and perfectly reset the timeline to match the originally budgeted team allocations.
- **Custom Modals**: Replaced native browser pop-ups (`window.prompt`, `window.confirm`) with beautiful, animated UI components (`PromptModal`, `ConfirmModal`).
- **Locked-in allocation rates**: Each allocation now snapshots the team member's hourly cost at the moment it's created or reassigned, so a later salary change no longer retroactively changes the numbers on an already-agreed proposal. Applies to the Fee Proposal Canvas, Project Summary, Payment Schedule, Overview Dashboard, Gantt budget line, Excel/Word exports, and Document Builder financial blocks.
- **Refresh Rates**: Admins can click the refresh icon next to Total Cost on the Fee Proposal Canvas to deliberately re-pull everyone's current rate into a still-open project.
- **Firestore security rules in version control**: `firestore.rules` / `firebase.json` / `.firebaserc` are now tracked in the repo and deployable, instead of living only in the Firebase console.
- **Server-side account provisioning**: Signup and invite acceptance now go through `/api/auth/provision` (Admin SDK), which validates invites and assigns `companyId`/`role` itself.

### Changed
- **Project Status Consistency**: Standardized the project status dropdown in `ProjectSettingsModal` to exclusively use: Draft, Proposed, Active, Completed, Lost.
- **Print Optimization**: Refactored CSS (`@media print`) and Layout elements to fully support multi-page PDF generation without container clipping.
- **Team Resources & Overheads Calculator are now admin-only**: both pages (and their nav links) redirect non-admins away, and Firestore rules reject non-admin writes to `teamMembers`/`overheadsProfile`, matching the app's existing claim that salaries are never exposed to non-admins.

### Fixed
- Fixed an issue where the Document Builder sidebar template replacement script failed to mount correctly.
- Fixed an issue where saved blocks required a hard page reload to fetch correctly.
- Fixed an authentication issue where dragging/saving templates failed due to a missing `companyId` security stamp.
- **Tenant isolation**: closed a Firestore rules gap that let any authenticated user write to another company's `companies` document, and removed a leftover "temporary" migration rule that allowed reading/updating any document company-wide if it lacked a `companyId`.
- **Account takeover via self-escalation**: closed a gap where a user could write an arbitrary `companyId` and `role: 'admin'` into their own user document, gaining instant admin access to a company they were never invited to.
- Fixed a duplicate/clipped tooltip on the new Refresh Rates button.

