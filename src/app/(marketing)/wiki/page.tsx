import React from 'react';
import Link from 'next/link';
import { 
  Book, 
  FolderKanban, 
  Users, 
  CreditCard, 
  ChevronRight, 
  FileSpreadsheet, 
  Edit3, 
  CalendarCheck,
  Calculator,
  GripHorizontal,
  PieChart
} from 'lucide-react';

export default function WikiPage() {
  return (
    <div className="pt-20 bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* Wiki Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-6">
            <Book size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Documentation & Wiki</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Learn how to use Enzyme APD Fee Calculator to accurately price your architectural projects.
          </p>
        </div>
      </div>

      {/* Wiki Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Table of Contents */}
        <div className="mb-16 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Contents</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-3">
              <li>
                <Link href="#team-resources" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 1. Team Resources
                </Link>
              </li>
              <li>
                <Link href="#project-management" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 2. Project Creation & Editing
                </Link>
              </li>
              <li>
                <Link href="#phase-management" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 3. Phase Creation & Editing
                </Link>
              </li>
              <li>
                <Link href="#drag-resources" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 4. Drag & Drop Resources
                </Link>
              </li>
            </ul>
            <ul className="space-y-3">
              <li>
                <Link href="#fee-proposal" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 5. Fee Proposal Creation
                </Link>
              </li>
              <li>
                <Link href="#financial-summary" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 6. Financial Summary Info
                </Link>
              </li>
              <li>
                <Link href="#payments-schedules" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 7. Payments & Schedules
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-16">
          
          {/* Section 1: Team Resources */}
          <section id="team-resources" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Users size={24} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1. Team Resources</h2>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                To accurately calculate costs, you must define the team members who will be working on your projects along with their internal cost rates and external billing rates.
              </p>
              
              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Adding Team Members Manually</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Navigate to the <strong>Team Resources</strong> tab.</li>
                <li>Click <strong>"Add Team Member"</strong>.</li>
                <li>Assign them a Role (e.g., Senior Architect, Draftsman) and set their internal and external hourly rates.</li>
              </ol>

              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Bulk Uploading via CSV</h4>
              <p>For large teams, use the bulk CSV import feature to instantly load your entire roster.</p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>In the top right of the Team Resources tab, click <strong>Upload CSV</strong>.</li>
                <li>Click <strong>Download Template</strong> to get the required format.</li>
                <li>Fill out your team members' details: <code>Name</code>, <code>Role</code>, <code>Internal Rate</code>, and <code>External Rate</code>.</li>
                <li>Save the file as a CSV and upload it. The system will automatically parse and import your entire team in seconds.</li>
              </ol>

              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Bulk Editing Rates</h4>
              <p>As salaries change, you need a way to quickly update your team's rates.</p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>Click the <strong>Bulk Edit</strong> button near the top right.</li>
                <li>The view transforms into an interactive spreadsheet. Tab through the input fields to update rates simultaneously.</li>
                <li>Click the <strong>Save All</strong> button to commit the updates in one swift action.</li>
              </ol>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 2: Project Management */}
          <section id="project-management" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <FolderKanban size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">2. Project Creation & Editing</h2>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                Creating a project is the foundation for your fee proposal.
              </p>
              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Creating a Project</h4>
              <ol className="list-decimal pl-5 space-y-2 mt-4">
                <li>Navigate to the <strong>Projects & Phases</strong> tab.</li>
                <li>Click the blue <strong>"New Project"</strong> button.</li>
                <li>Fill in the project metadata: Name, Client, Total Square Meters, and Status.</li>
              </ol>

              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Editing a Project</h4>
              <p>
                To edit a project's details later, click the <strong>Settings (gear) icon</strong> next to the project name in the sidebar. You can update the client name, adjust the total square meters (which impacts sqm-based metrics), or archive the project entirely.
              </p>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 3: Phase Management */}
          <section id="phase-management" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <PieChart size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">3. Phase Creation & Editing</h2>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                Projects are broken down into Phases (e.g., Concept Design, Schematic Design, RIBA Stages). 
              </p>
              
              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Managing Phases</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Creating:</strong> Inside a project, click <strong>"Add Phase"</strong> to create a new stage of work.</li>
                <li><strong>Editing:</strong> You can edit the Phase Name, Description, and adjust its start/end dates using the calendar selectors.</li>
              </ul>

              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Understanding Phase Elements</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Graphic Bars:</strong> Next to each phase, a colored graphic bar visually indicates the proportion of total project hours or budget consumed by this phase relative to others.</li>
                <li><strong>Phase Summaries:</strong> At the bottom of each phase block, a summary shows the total hours allocated within that specific phase, the blended hourly rate, and the total cost/revenue generated just by that phase.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 4: Drag Resources */}
          <section id="drag-resources" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <GripHorizontal size={24} className="text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">4. Drag & Drop Resources</h2>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                The core of the calculation happens by assigning your Team Resources to your Phases.
              </p>
              <ol className="list-decimal pl-5 space-y-2 mt-4">
                <li>Open a Project to view your Phases.</li>
                <li>On the right side of the screen, you will see your <strong>Team Pool</strong>.</li>
                <li>Click the drag handle (six dots) next to a team member and <strong>drag them into the drop zone</strong> of a specific Phase.</li>
                <li>Once dropped, an Allocation row appears. Enter the number of hours this person will work during this phase.</li>
              </ol>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 5: Fee Proposal Creation */}
          <section id="fee-proposal" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calculator size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">5. Fee Proposal Creation</h2>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                As you drag resources into phases and allocate hours, the system is performing a <strong>bottom-up calculation</strong> in real-time.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4">
                <li><strong>Bottom-Up Method:</strong> Instead of guessing a flat fee and hoping it covers your costs, you calculate exactly how much time the project needs.</li>
                <li><strong>Real-time Totals:</strong> The <em>Fee Proposal</em> tab aggregates every hour allocated across all phases, multiplies them by the external billing rates, and presents the final recommended fee to charge the client.</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 6: Financial Summary */}
          <section id="financial-summary" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FileSpreadsheet size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">6. Financial Summary Info</h2>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                The Financial Summary panel is the most important dashboard for understanding project profitability.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <h5 className="font-bold text-slate-900 dark:text-white mb-2">Total Internal Cost</h5>
                  <p className="text-sm">The sum of all allocated hours multiplied by their respective <strong>Internal Rates</strong>. This is exactly what the project costs your company to execute.</p>
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <h5 className="font-bold text-slate-900 dark:text-white mb-2">Total External Fee</h5>
                  <p className="text-sm">The sum of all allocated hours multiplied by their respective <strong>External Rates</strong>. This is what you charge the client.</p>
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <h5 className="font-bold text-slate-900 dark:text-white mb-2">Gross Profit</h5>
                  <p className="text-sm">The difference between the External Fee and the Internal Cost. Your actual monetary gain.</p>
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <h5 className="font-bold text-slate-900 dark:text-white mb-2">Margin (%)</h5>
                  <p className="text-sm">The Gross Profit expressed as a percentage of the External Fee. High margins indicate healthy profitability.</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 7: Payments */}
          <section id="payments-schedules" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                <CalendarCheck size={24} className="text-cyan-600 dark:text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">7. Payments & Schedules</h2>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                Once your total Fee Proposal is calculated, you must structure how the client pays you. 
              </p>
              
              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Payment Creation & Editing</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Inside your Project view, locate the <strong>Payment Schedule</strong> section.</li>
                <li>You can add payments manually by specifying a name, a target date, and a percentage of the total fee.</li>
                <li>The system will automatically convert that percentage into a monetary value based on the total project fee calculated in Step 5.</li>
              </ol>

              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Payment Templates</h4>
              <p>
                If you use standard billing structures (e.g., 20% upfront, 50% at schematic design, 30% on delivery), use Templates to save time!
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Generate from Templates:</strong> Click "Apply Template" to instantly populate your schedule using standard industry templates.</li>
                <li><strong>Save Custom Templates:</strong> Build your perfect schedule and click "Save as Template". It will be saved securely under your company profile for your whole team to use on future projects.</li>
              </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
