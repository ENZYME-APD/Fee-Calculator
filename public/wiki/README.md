# Wiki Media Files

This folder is intended to store GIFs or video files that you want to embed in the documentation wiki.

## How to add media to the Wiki:

1. **Record your screen**: Use a tool like Loom, CleanShot X (Mac), or the built-in screen recorder to capture your workflow.
2. **Save the file**: Export the recording as a `.gif` or `.mp4`. Keep the file sizes small (ideally under 5MB for GIFs) so the page loads quickly.
3. **Name the file**: Give it a clear, descriptive name like `add-team-member.gif` or `drag-and-drop.gif`.
4. **Place it in this folder**: Move the file into this `public/wiki/` directory.
5. **Update the Wiki code**: 
   - Open `src/app/(marketing)/wiki/page.tsx`
   - Find the section where you want to embed the image.
   - Add an `<img>` tag pointing to `/wiki/your-file-name.gif`

Example:
```tsx
<img 
  src="/wiki/drag-and-drop.gif" 
  alt="Demonstration of drag and drop" 
  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 my-4 shadow-sm" 
/>
```

### Automation?
Automating the recording of these workflows is technically possible using End-to-End (E2E) testing frameworks like Cypress or Playwright. These tools can programmatically click through the app and record a video of the test execution. 
However, for documentation purposes, this is generally considered overkill and very brittle, as any minor UI change will break the automated test script. Manually recording short GIFs when the UI is stable is the standard industry practice.
