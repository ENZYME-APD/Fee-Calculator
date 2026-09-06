const fs = require('fs');
const file = 'src/components/wiki/WikiContent.tsx';
let code = fs.readFileSync(file, 'utf8');

const securitySection = `
          {/* Section: Data Security & Compliance */}
          <div id="security-compliance" className="pt-24 -mt-24 mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                <ShieldAlert className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Data Security & Compliance</h2>
            </div>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                We know that financial estimates and salary data are highly sensitive. Fee Calculator uses enterprise-grade security to ensure your data is isolated, encrypted, and strictly access-controlled.
              </p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">
                      <Building size={14} className="text-slate-400" />
                      Strict Tenant Isolation
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Every database query is strictly filtered by your unique <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">companyId</code>. Our Firebase Security Rules explicitly deny any read or write request that attempts to access data outside of your authenticated company workspace.
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 text-sm flex items-center gap-2">
                      <Users size={14} className="text-slate-400" />
                      Role-Based Access
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Even within your company, data is governed by roles. <strong className="text-slate-700 dark:text-slate-300">Admins</strong> can view and modify global rates, while standard <strong className="text-slate-700 dark:text-slate-300">Members</strong> can only create project proposals based on those rates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
`;

code = code.replace(
  '{/* Section: Document Builder */}',
  securitySection + '\n          {/* Section: Document Builder */}'
);

fs.writeFileSync(file, code);
