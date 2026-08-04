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
  PieChart,
  Settings,
  Building
} from 'lucide-react';

export function WikiContent() {
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
        
        {/* Quick Start Guide */}
        <div className="mb-16 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Book size={24} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Quick Start Guide</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">1</div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Set Up Your Team</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Head to the <strong>Settings &gt; Team Management</strong> tab to add your team members, their internal costs, and external billing rates.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">2</div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Create a Project</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Click <strong>New Project</strong> in the Projects tab. Define the scope and add project phases (e.g., Concept Design, Schematic Design).</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">3</div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Allocate Hours</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm"><strong>Drag and drop</strong> team members from the right sidebar into your project phases to allocate hours and calculate costs.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300">4</div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Review Fee Proposal</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Switch to the <strong>Fee Proposal</strong> tab to see your bottom-up calculation of internal costs, external fees, and profit margin.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  <ChevronRight size={16} className="shrink-0" /> 2. Projects & Templates
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
              <li>
                <Link href="#global-preferences" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 8. Global Preferences
                </Link>
              </li>
              <li>
                <Link href="#calculating-overheads" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 9. Best Practices: Overheads
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
              {/* TODO: Add a GIF demonstrating manual team member creation here */}
              {/* <img src="/wiki/add-team.gif" alt="Adding team members" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 my-4 shadow-sm" /> */}

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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">2. Projects & Templates</h2>
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

              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Project Templates</h4>
              <p>
                To standardize your workflow, you can save any project as a template or start new projects from existing templates.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Using a Template:</strong> When creating a new project, select a starting template (e.g. "RIBA Stages") from the top dropdown to automatically prepopulate phases and standard costs.</li>
                <li><strong>Saving as Template:</strong> In the Projects & Phases tab, click the Settings (gear) icon on a project and select "Save as Template". All its phases, allocations, and costs will be saved as a reusable template.</li>
                <li><strong>Managing Templates:</strong> Navigate to the <strong>Templates</strong> tab in the sidebar to view, edit, or delete your custom project templates.</li>
              </ul>
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
              {/* TODO: Add a GIF demonstrating drag and drop here */}
              {/* <img src="/wiki/drag-and-drop.gif" alt="Drag and drop resources" className="w-full rounded-xl border border-slate-200 dark:border-slate-800 my-4 shadow-sm" /> */}

              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Duplicating Resources Across Phases</h4>
              <p>
                To speed up data entry for recurring costs or team members who work across multiple stages, use the quick-duplicate actions:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Hover over any allocated team member or cost chip inside a phase lane to reveal the action menu grid on the right side.</li>
                <li><strong>Duplicate to Next Phase (Right Arrow):</strong> Instantly copies the exact allocation (person and hours) or cost into the immediately following chronological phase.</li>
                <li><strong>Duplicate to All Phases (Stack Icon):</strong> Copies the allocation or cost into <em>every</em> other phase in the project simultaneously.</li>
                <li><strong>Edit (Pencil) / Delete (Trash):</strong> Modify the hours or remove the allocation entirely from that phase.</li>
              </ul>
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

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 8: Global Preferences */}
          <section id="global-preferences" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
                <Settings size={24} className="text-slate-600 dark:text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">8. Global Preferences</h2>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                You can customize the platform to suit your company's region by setting global preferences. These settings propagate instantly across all of your projects, team members, and fee proposals.
              </p>
              
              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">Changing Currency & Units</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Navigate to the <strong>Settings</strong> page from the main navigation sidebar.</li>
                <li>Select the <strong>General Preferences</strong> tab.</li>
                <li><strong>Currency:</strong> Choose your preferred currency from a wide range of international options (e.g., USD, EUR, GBP, AUD, JPY, CNY). The platform will automatically format all costs using the correct symbols and regional separators.</li>
                <li><strong>Area Unit:</strong> Select whether your architectural projects are measured in <strong>Square Meters (sqm)</strong> or <strong>Square Feet (sqft)</strong>.</li>
              </ol>
            </div>
          </section>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Section 9: Best Practices: Calculating Overheads */}
          <section id="calculating-overheads" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                <Building size={24} className="text-rose-600 dark:text-rose-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">9. Best Practices: Calculating Overheads</h2>
            </div>
            
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
              <p>
                To accurately set your team's <strong>Internal Rate</strong>, you must calculate your true cost of doing business. Your internal rate is not just a person's raw salary; it must include their share of the company's overhead expenses.
              </p>

              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">1. Expense Categories to Consider</h4>
              <p>When calculating total annual overhead, ensure you include these often-missed categories:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Office & Facilities:</strong> Rent, utilities, cleaning services, maintenance, and physical security.</li>
                <li><strong>Technology & IT:</strong> Software subscriptions (e.g., BIM, Adobe, Microsoft 365, Enzyme APD), cloud storage, hardware depreciation, and IT support services.</li>
                <li><strong>Professional Expenses:</strong> Professional liability insurance, business insurance, industry memberships, certifications, and accounting/legal fees.</li>
                <li><strong>Business Development:</strong> Marketing budgets, travel for BD trips, conference tickets, client entertainment, and website hosting.</li>
                <li><strong>Employee Benefits:</strong> Health insurance, retirement contributions, training budgets, and team building events.</li>
              </ul>

              <h4 className="font-bold text-slate-900 dark:text-slate-200 mt-6 mb-2">2. Factoring in Non-Billable Hours</h4>
              <p>Your team members are not 100% billable. They take time off and perform internal tasks that clients do not pay for. You must distribute the cost of these non-billable hours across the billable hours.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Leave & Holidays:</strong> Paid time off, sick leave, and public holidays.</li>
                <li><strong>Internal Admin:</strong> Timesheet entry, performance reviews, general staff meetings, and email management.</li>
                <li><strong>Management Time:</strong> Directors and managers spend significant time mentoring, reviewing company strategy, or doing non-project-specific QA.</li>
                <li><strong>Business Development:</strong> Time spent drafting proposals, pitching, and networking.</li>
              </ul>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50 mt-6">
                <h5 className="font-bold text-blue-900 dark:text-blue-300 mb-2">The Golden Formula</h5>
                <p className="text-sm text-blue-800 dark:text-blue-400 mb-0">
                  <code>Internal Rate = (Annual Salary + Proportion of Overheads) / Target Billable Hours per Year</code>
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-400 mt-2">
                  By factoring in non-billable hours to reduce the denominator, and adding overheads to the numerator, your Internal Rate will accurately reflect the true break-even cost for every hour a team member spends on a project.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
