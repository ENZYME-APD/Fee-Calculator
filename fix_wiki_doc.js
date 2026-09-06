const fs = require('fs');
const file = 'src/components/wiki/WikiContent.tsx';
let code = fs.readFileSync(file, 'utf8');

const newSection = `
          {/* Section: Document Builder */}
          <div id="document-builder" className="pt-24 -mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <FileText className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Document Builder</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                The <strong className="text-slate-800 dark:text-slate-200">Document Builder</strong> automatically turns your Fee Proposal data into a professional document ready to send to clients.
              </p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm">Modular Blocks</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Mix and match rich text blocks with dynamic tables. Reorder them using drag-and-drop to customize the exact flow of your proposal.
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">
                      <Download size={14} className="text-slate-400" />
                      Export to Word
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Export your assembled blocks directly to a native Microsoft Word (.docx) file. This gives you ultimate control to make pixel-perfect tweaks before sending to clients.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
`;

code = code.replace(
  '{/* Section 6: Financial Summary */}',
  newSection + '\n          {/* Section 6: Financial Summary */}'
);

if (!code.includes('FileText')) {
  code = code.replace('CalendarCheck,', 'CalendarCheck,\n  FileText,\n  Download,');
} else {
  code = code.replace('FileText', 'FileText, Download');
}

fs.writeFileSync(file, code);
