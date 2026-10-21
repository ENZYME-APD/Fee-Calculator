"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { Editor } from '@tiptap/react';
import { Braces } from 'lucide-react';
import { FIELD_DEFS, FIELD_LABELS, FieldValues } from '@/lib/proposal/fields';

const key = new PluginKey('proposalFields');

/**
 * Highlights {{field}} in the editor: info colour when the project has a value (shown on hover),
 * warning colour when it is still empty. `getValues` is read on every redraw, so the colours
 * follow the latest project details; call `editor.view.dispatch(editor.state.tr)` to refresh.
 */
export const FieldHighlight = Extension.create<{ getValues: () => FieldValues | null }>({
  name: 'proposalFields',
  addOptions() { return { getValues: () => null }; },
  addProseMirrorPlugins() {
    const getValues = this.options.getValues;
    return [new Plugin({
      key,
      props: {
        decorations(state) {
          const values = getValues();
          const decos: Decoration[] = [];
          state.doc.descendants((node, pos) => {
            if (!node.isText || !node.text) return;
            for (const m of node.text.matchAll(/\{\{\s*([a-z0-9_]+)\s*\}\}/gi)) {
              const k = m[1].toLowerCase();
              const known = k in FIELD_LABELS;
              const v = values ? values[k] : null;
              const cls = !known ? 'pf-unknown' : !values ? 'pf-field' : v ? 'pf-field pf-has' : 'pf-field pf-empty';
              const title = !known ? 'Unknown field' : !values ? FIELD_LABELS[k] : v ? `${FIELD_LABELS[k]}: ${v}` : `${FIELD_LABELS[k]}: not filled in yet`;
              decos.push(Decoration.inline(pos + m.index!, pos + m.index! + m[0].length, { class: cls, title }));
            }
          });
          return DecorationSet.create(state.doc, decos);
        },
      },
    })];
  },
});

/** Toolbar button with the list of fields; inserts {{field}} at the cursor. */
export function InsertFieldMenu({ editor }: { editor: Editor | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  if (!editor) return null;
  const groups = [...new Set(FIELD_DEFS.map(f => f.group))];
  return (
    <div className="relative" ref={ref}>
      <button type="button" title="Insert field" onMouseDown={e => e.preventDefault()} onClick={() => setOpen(o => !o)}
        className={`p-1.5 rounded hover:bg-ink-100 dark:hover:bg-ink-700 flex items-center gap-1 text-xs font-medium ${open ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' : ''}`}>
        <Braces size={14} /> Field
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 max-h-80 overflow-y-auto bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-xl shadow-lg py-1">
          {groups.map(g => (
            <div key={g}>
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-ink-500 dark:text-ink-400">{g}</div>
              {FIELD_DEFS.filter(f => f.group === g).map(f => (
                <button key={f.key} type="button" onMouseDown={e => e.preventDefault()}
                  onClick={() => { editor.chain().focus().insertContent(`{{${f.key}}}`).run(); setOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-700 flex justify-between gap-2">
                  <span>{f.label}</span><span className="text-[11px] text-ink-500 dark:text-ink-400 font-mono">{f.key}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
