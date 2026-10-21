"use client";
import React, { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { X, Pencil, Bold, Italic, List, ListOrdered, Heading3 } from 'lucide-react';
import { SavedBlock } from '@/lib/firebase/schema';

interface Props {
  template: SavedBlock | null;
  onSave: (changes: { templateName: string; title: string; content: string }) => Promise<void>;
  onClose: () => void;
}

/** Edits a saved template of the Document builder: its name, the heading it gets and its text. */
export function TemplateEditModal({ template, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [heading, setHeading] = useState('');
  const [saving, setSaving] = useState(false);
  const isText = template?.type === 'rich_text';

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'prose prose-ink dark:prose-invert max-w-none focus:outline-none min-h-[240px] text-sm' },
    },
  });

  useEffect(() => {
    if (!template) return;
    setName(template.templateName || '');
    setHeading(template.title || '');
    editor?.commands.setContent(template.content || '');
  }, [template, editor]);

  if (!template) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ templateName: name.trim(), title: heading, content: isText && editor ? editor.getHTML() : template.content });
    } finally {
      setSaving(false);
    }
  };

  const tool = (active: boolean) =>
    `p-1.5 rounded hover:bg-ink-100 dark:hover:bg-ink-700 ${active ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' : 'text-ink-600 dark:text-ink-300'}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-900/50 backdrop-blur-sm p-4">
      <form onSubmit={submit} className="bg-white dark:bg-ink-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-ink-100 dark:border-ink-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-accent-100 dark:bg-accent-900/30 p-2 rounded-xl text-accent-600 dark:text-accent-400"><Pencil size={20} /></div>
            <h2 className="text-xl font-bold text-ink-800 dark:text-ink-200">Edit template</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800 rounded-full"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto bg-ink-50/50 dark:bg-ink-950/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-medium text-ink-500 dark:text-ink-400">Template name</span>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="mt-1 w-full px-3 py-2 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl text-sm text-ink-900 dark:text-ink-50 outline-none focus:ring-2 focus:ring-accent-500/20" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-ink-500 dark:text-ink-400">Heading in the document</span>
              <input value={heading} onChange={e => setHeading(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl text-sm text-ink-900 dark:text-ink-50 outline-none focus:ring-2 focus:ring-accent-500/20" />
            </label>
          </div>

          {isText ? (
            <div className="bg-white dark:bg-ink-900 border border-ink-200 dark:border-ink-800 rounded-xl">
              {editor && (
                <div className="flex items-center gap-1 p-1.5 border-b border-ink-100 dark:border-ink-800 sticky top-0 bg-white dark:bg-ink-900 rounded-t-xl">
                  <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={tool(editor.isActive('bold'))}><Bold size={14} /></button>
                  <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={tool(editor.isActive('italic'))}><Italic size={14} /></button>
                  <button type="button" title="Subheading" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={tool(editor.isActive('heading', { level: 3 }))}><Heading3 size={14} /></button>
                  <div className="w-px h-4 bg-ink-200 dark:bg-ink-700 mx-1" />
                  <button type="button" title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={tool(editor.isActive('bulletList'))}><List size={14} /></button>
                  <button type="button" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={tool(editor.isActive('orderedList'))}><ListOrdered size={14} /></button>
                </div>
              )}
              <div className="p-4"><EditorContent editor={editor} /></div>
            </div>
          ) : (
            <p className="text-sm text-ink-500 dark:text-ink-400">This block fills itself from the project&apos;s data, so only its name and heading can be edited.</p>
          )}
          <p className="text-xs text-ink-500 dark:text-ink-400">Changes apply to new insertions. Blocks already in documents keep their text.</p>
        </div>

        <div className="p-6 border-t border-ink-100 dark:border-ink-800 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-ink-600 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-white bg-accent-600 hover:bg-accent-700 disabled:opacity-60 shadow-md shadow-accent-600/20">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
}
