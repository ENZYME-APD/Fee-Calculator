import { adminDb } from '@/lib/firebase/admin';
import { SavedBlock } from '@/lib/firebase/schema';
import { applyChange, newId } from './changes';
import { ToolDef, ToolError, bool, str } from './tools';
import { done } from './writeTools';

// Saved templates of the Document builder (the "Saved templates" column): reusable text blocks such
// as terms and conditions, excluded services or standard rates, inserted into any proposal.

type Json = Record<string, unknown>;
const MAX_HTML = 60000;
// What the builder's text editor understands (TipTap StarterKit)
const ALLOWED = new Set(['p', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'ul', 'ol', 'li', 'br', 'blockquote', 'hr']);

/** Keeps only the editor's tags, without attributes. Plain text becomes paragraphs. */
export function cleanHtml(input: string): string {
  let html = input.trim();
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    html = html.split(/\n{2,}/).map(p => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`).join('');
  }
  html = html.replace(/<(script|style|iframe|object)[\s\S]*?<\/\1>/gi, '');
  html = html.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (tag, name: string) => {
    const n = name.toLowerCase();
    if (!ALLOWED.has(n)) return '';
    const t = n === 'b' ? 'strong' : n === 'i' ? 'em' : n;
    return tag.startsWith('</') ? `</${t}>` : `<${t}>`;
  });
  return html;
}

const text = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function templates(companyId: string): Promise<(SavedBlock & { id: string })[]> {
  const s = await adminDb!.collection('saved_blocks').where('companyId', '==', companyId).get();
  return s.docs.map(d => ({ ...(d.data() as SavedBlock), id: d.id }));
}

function find(list: (SavedBlock & { id: string })[], ref: string) {
  const low = ref.trim().toLowerCase();
  return list.filter(t => t.id === ref || (t.templateName || '').trim().toLowerCase() === low);
}

export const DOCUMENT_TOOLS: ToolDef[] = [
  {
    name: 'list_document_templates',
    title: 'List document templates',
    description: 'Saved templates of the Document builder (reusable blocks such as terms and conditions, excluded services or standard rates). Returns each template\'s name, block type and heading, and optionally its text (HTML).',
    inputSchema: {
      type: 'object',
      properties: { include_content: { type: 'boolean', description: 'Include each template\'s content. Default false.' } },
      additionalProperties: false,
    },
    run: async (args, ctx) => {
      const withContent = bool(args, 'include_content', false);
      const list = await templates(ctx.companyId);
      return {
        templates: list.map(t => ({
          template_id: t.id, name: t.templateName, type: t.type, heading: t.title || null,
          ...(withContent ? { content_html: t.content } : { preview: text(t.content || '').slice(0, 160) }),
        })),
      };
    },
  },
  {
    name: 'save_document_template',
    title: 'Save document template',
    description: 'Creates a text template in the Document builder\'s saved templates, or replaces the content of an existing one with the same name (only with replace: true). Content is HTML using p, h3, strong, em, ul/ol/li and br; plain text with blank lines between paragraphs also works. Tell the user the template name and content before saving.',
    writes: true,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Template name shown in the saved templates column, e.g. Terms and conditions.' },
        heading: { type: 'string', description: 'Heading the block gets in the document. Defaults to the name.' },
        content_html: { type: 'string', description: 'The text, as HTML or plain text.' },
        replace: { type: 'boolean', description: 'Replace an existing template with the same name. Default false.' },
      },
      required: ['name', 'content_html'],
      additionalProperties: false,
    },
    run: async (args, ctx) => {
      const name = str(args, 'name');
      if (!name) throw new ToolError('Give the template a name.');
      const raw = typeof args.content_html === 'string' ? args.content_html : '';
      const content = cleanHtml(raw);
      if (!text(content)) throw new ToolError('The content is empty.');
      if (content.length > MAX_HTML) throw new ToolError(`The content is too long (${content.length} characters, at most ${MAX_HTML}). Split it into several templates.`);
      const heading = str(args, 'heading') || name;
      const existing = find(await templates(ctx.companyId), name);
      if (existing.length > 1) throw new ToolError(`More than one template is called "${name}". Use a different name.`);
      if (existing.length && !bool(args, 'replace', false)) throw new ToolError(`A template called "${name}" already exists. Pass replace: true to overwrite it, or choose another name.`);
      const id = existing[0]?.id || newId('saved_blocks');
      const data: Omit<SavedBlock, 'id'> = { companyId: ctx.companyId, templateName: name, type: existing[0]?.type === 'rich_text' || !existing[0] ? 'rich_text' : existing[0].type, title: heading, content };
      const summary = `${existing.length ? 'Replaced' : 'Saved'} document template "${name}"`;
      const changeId = await applyChange(ctx, 'save_document_template', summary, [{ collection: 'saved_blocks', id, data: data as unknown as Json }]);
      return done(summary + '. It appears under Saved templates in the Document builder (reload the page if it is open).', changeId, { template_id: id });
    },
  },
  {
    name: 'delete_document_template',
    title: 'Delete document template',
    description: 'Deletes a saved template from the Document builder. Blocks already inserted into documents are not affected. Matches the exact name or template_id.',
    writes: true,
    inputSchema: {
      type: 'object',
      properties: { template: { type: 'string', description: 'Exact template name or template_id.' } },
      required: ['template'],
      additionalProperties: false,
    },
    run: async (args, ctx) => {
      const ref = str(args, 'template');
      if (!ref) throw new ToolError('Give the template name or template_id.');
      const hits = find(await templates(ctx.companyId), ref);
      if (!hits.length) throw new ToolError(`No template is called exactly "${ref}". Call list_document_templates to see them.`);
      if (hits.length > 1) throw new ToolError(`More than one template is called "${ref}". Use the template_id.`);
      const summary = `Deleted document template "${hits[0].templateName}"`;
      const changeId = await applyChange(ctx, 'delete_document_template', summary, [{ collection: 'saved_blocks', id: hits[0].id, data: null }]);
      return done(summary + '.', changeId);
    },
  },
];
