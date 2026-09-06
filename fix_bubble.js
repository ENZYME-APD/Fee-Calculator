const fs = require('fs');
const file = 'src/components/documents/SortableBlock.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';",
  "import { EditorContent, useEditor } from '@tiptap/react';"
);

const staticToolbar = `
        <div className="prose-wrapper relative group/editor">
          {editor && (
            <div className="opacity-0 group-hover/editor:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-700 absolute -top-10 left-0 z-20">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={\`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 \${editor.isActive('bold') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}\`}
              ><Bold size={14} /></button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={\`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 \${editor.isActive('italic') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}\`}
              ><Italic size={14} /></button>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={\`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 \${editor.isActive('bulletList') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}\`}
              ><List size={14} /></button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={\`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 \${editor.isActive('orderedList') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : ''}\`}
              ><ListOrdered size={14} /></button>
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
`;

code = code.replace(
  /<div className="prose-wrapper relative group\/editor">[\s\S]*?<BubbleMenu[\s\S]*?<\/BubbleMenu>[\s\S]*?<EditorContent editor={editor} \/>[\s\S]*?<\/div>/,
  staticToolbar.trim()
);

fs.writeFileSync(file, code);
