# Changelog - Enzyme Fee Calculator

## [Unreleased] - Recent Updates

### Added
- **Phase Settings Modal**: Added a new rich editing modal for Project Phases, allowing you to define Tasks, Deliverables, Inclusions, and Omissions directly within templates and projects.
- **Document Builder Sidebar**: Implemented a dual-pane sidebar splitting Project Proposals (top) and a Saved Templates Library (bottom).
- **Template Drag & Drop**: Templates from the sidebar library can now be dragged directly into the Document Builder canvas.
- **Reset to Budget**: Added a button to the Gantt Planner to delete manually adjusted tasks and perfectly reset the timeline to match the originally budgeted team allocations.
- **Custom Modals**: Replaced native browser pop-ups (`window.prompt`, `window.confirm`) with beautiful, animated UI components (`PromptModal`, `ConfirmModal`).

### Changed
- **Project Status Consistency**: Standardized the project status dropdown in `ProjectSettingsModal` to exclusively use: Draft, Proposed, Active, Completed, Lost.
- **Print Optimization**: Refactored CSS (`@media print`) and Layout elements to fully support multi-page PDF generation without container clipping.

### Fixed
- Fixed an issue where the Document Builder sidebar template replacement script failed to mount correctly.
- Fixed an issue where saved blocks required a hard page reload to fetch correctly.
- Fixed an authentication issue where dragging/saving templates failed due to a missing `companyId` security stamp.

