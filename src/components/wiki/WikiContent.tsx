import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Bookmark,
  FileText,
  Download, 
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
  Building,
  RefreshCw,
  TrendingUp
} from 'lucide-react';

export function WikiContent() {
  return (
    <div className="pt-20 bg-ink-50 dark:bg-ink-950 min-h-screen">
      
      {/* Wiki Header */}
      <div className="bg-white dark:bg-ink-900 border-b border-ink-200 dark:border-ink-800 pt-16 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center justify-center p-3 bg-accent-100 dark:bg-accent-900/30 rounded-2xl mb-6">
            <Book size={32} className="text-accent-600 dark:text-accent-400" />
          </div>
          <h1 className="text-4xl font-extrabold text-ink-900 dark:text-ink-50 mb-4">Documentation & Wiki</h1>
          <p className="text-lg text-ink-500 dark:text-ink-400">
            Learn how to use Enzyme APD Fee Calculator to accurately price your architectural projects.
          </p>
        </div>
      </div>

      {/* Wiki Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        
        {/* Quick Start Guide */}
        <div className="mb-16 bg-accent-50 dark:bg-accent-900/10 border border-accent-200 dark:border-accent-800/50 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent-600 rounded-xl text-white">
              <Book size={24} />
            </div>
            <h2 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">Quick Start Guide</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-200 dark:bg-accent-800 flex items-center justify-center font-bold text-accent-700 dark:text-accent-300">1</div>
                <div>
                  <h4 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-1">Set Up Your Team</h4>
                  <p className="text-ink-600 dark:text-ink-400 text-sm">Head to the <strong>Settings &gt; Team Management</strong> tab to add your team members, their internal costs, and external billing rates. You can add them manually or <strong>upload from a CSV template</strong>.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-200 dark:bg-accent-800 flex items-center justify-center font-bold text-accent-700 dark:text-accent-300">2</div>
                <div>
                  <h4 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-1">Create a Project</h4>
                  <p className="text-ink-600 dark:text-ink-400 text-sm">Click <strong>New Project</strong> in the Projects tab. You can start from scratch or use <strong>preset templates for standard architectural phases</strong> (like RIBA). Everything comes fully editable so you can update them later to fit your requirements.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-200 dark:bg-accent-800 flex items-center justify-center font-bold text-accent-700 dark:text-accent-300">3</div>
                <div>
                  <h4 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-1">Allocate Hours</h4>
                  <p className="text-ink-600 dark:text-ink-400 text-sm"><strong>Drag and drop</strong> team members from the right sidebar into your project phases to allocate hours and calculate costs.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-200 dark:bg-accent-800 flex items-center justify-center font-bold text-accent-700 dark:text-accent-300">4</div>
                <div>
                  <h4 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-1">Review Fee Proposal</h4>
                  <p className="text-ink-600 dark:text-ink-400 text-sm">Switch to the <strong>Fee Proposal</strong> tab to see your bottom-up calculation of costs and margins. <strong>Payment schedules are auto-set</strong> based on your phases and can be customized as needed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="mb-16 p-6 bg-white dark:bg-ink-900 rounded-2xl border border-ink-200 dark:border-ink-800">
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50 mb-4">Contents</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="space-y-3">
              <li>
                <Link href="#team-resources" className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 1. Team Resources
                </Link>
              </li>
              <li>
                <Link href="#project-management" className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 2. Projects & Templates
                </Link>
              </li>
              <li>
                <Link href="#phase-management" className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 3. Phase Creation & Editing
                </Link>
              </li>
              <li>
                <Link href="#drag-resources" className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 4. Drag & Drop Resources
                </Link>
              </li>
            </ul>
            <ul className="space-y-3">
              <li>
                <Link href="#fee-proposal" className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 5. Fee Proposal Creation
                </Link>
              </li>
              <li>
                <Link href="#financial-summary" className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 6. Financial Summary Info
                </Link>
              </li>
              <li>
                <Link href="#payments-schedules" className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 7. Payments & Schedules
                </Link>
              </li>
              <li>
                <Link href="#global-preferences" className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 8. Global Preferences
                </Link>
              </li>
              <li>
                <Link href="#calculating-overheads" className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 9. Best Practices: Overheads
                </Link>
              </li>
              <li>
                <Link href="#financial-forecast" className="flex items-center gap-2 text-ink-600 dark:text-ink-400 hover:text-accent-600 dark:hover:text-accent-400 font-medium">
                  <ChevronRight size={16} className="shrink-0" /> 10. Financial Forecast
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
              <div className="p-2 bg-positive-100 dark:bg-positive-900/30 rounded-lg">
                <Users size={24} className="text-positive-600 dark:text-positive-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">1. Team Resources</h2>
            </div>
            
            <div className="prose prose-ink dark:prose-invert max-w-none text-ink-600 dark:text-ink-400">
              <p>
                To accurately calculate costs, you must define the team members who will be working on your projects along with their internal cost rates and external billing rates.
              </p>
              
              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Adding Team Members Manually</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Navigate to the <strong>Team Resources</strong> tab.</li>
                <li>Click <strong>"Add Team Member"</strong>.</li>
                <li>Assign them a Role (e.g., Senior Architect, Draftsman) and set their internal and external hourly rates.</li>
              </ol>
              <img src="/screenshots/team-resources.jpg?v=20261016" alt="Team Resources screen listing team members grouped by category with salary, overheads, and derived cost per hour" className="w-full rounded-xl border border-ink-200 dark:border-ink-800 my-6 shadow-sm" />

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Bulk Uploading via CSV</h4>
              <p>For large teams, use the bulk CSV import feature to instantly load your entire roster.</p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>In the top right of the Team Resources tab, click <strong>Upload CSV</strong>.</li>
                <li>Click <strong>Download Template</strong> to get the required format.</li>
                <li>Fill out your team members' details: <code>Name</code>, <code>Role</code>, <code>Internal Rate</code>, and <code>External Rate</code>.</li>
                <li>Save the file as a CSV and upload it. The system will automatically parse and import your entire team in seconds.</li>
              </ol>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Bulk Editing Rates</h4>
              <p>As salaries change, you need a way to quickly update your team's rates.</p>
              <ol className="list-decimal pl-5 space-y-2 mt-2">
                <li>Click the <strong>Bulk Edit</strong> button near the top right.</li>
                <li>The view transforms into an interactive spreadsheet. Tab through the input fields to update rates simultaneously.</li>
                <li>Click the <strong>Save All</strong> button to commit the updates in one swift action.</li>
              </ol>
            </div>
          </section>

          <hr className="border-ink-200 dark:border-ink-800" />

          {/* Section 2: Project Management */}
          <section id="project-management" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
                <FolderKanban size={24} className="text-accent-600 dark:text-accent-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">2. Projects & Templates</h2>
            </div>
            
            <div className="prose prose-ink dark:prose-invert max-w-none text-ink-600 dark:text-ink-400">
              <p>
                Creating a project is the foundation for your fee proposal.
              </p>
              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Creating a Project</h4>
              <ol className="list-decimal pl-5 space-y-2 mt-4">
                <li>Navigate to the <strong>Projects & Phases</strong> tab.</li>
                <li>Click the blue <strong>"New Project"</strong> button.</li>
                <li>Fill in the project metadata: Name, Client, Total Square Meters, and Status.</li>
              </ol>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Editing a Project</h4>
              <p>
                To edit a project's details later, click the <strong>Settings (gear) icon</strong> next to the project name in the sidebar. You can update the client name, adjust the total square meters (which impacts sqm-based metrics), or archive the project entirely.
              </p>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Project Templates</h4>
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

          <hr className="border-ink-200 dark:border-ink-800" />

          {/* Section 3: Phase Management */}
          <section id="phase-management" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-info-100 dark:bg-info-900/30 rounded-lg">
                <PieChart size={24} className="text-info-600 dark:text-info-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">3. Phase Creation & Editing</h2>
            </div>
            
            <div className="prose prose-ink dark:prose-invert max-w-none text-ink-600 dark:text-ink-400">
              <p>
                Projects are broken down into Phases (e.g., Concept Design, Schematic Design, RIBA Stages). 
              </p>
              
              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Managing Phases</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Creating:</strong> Inside a project, click <strong>"Add Phase"</strong> to create a new stage of work.</li>
                <li><strong>Editing:</strong> You can edit the Phase Name, Description, and adjust its start/end dates using the calendar selectors.</li>
                <li><strong>Project start date:</strong> Set it directly with the <strong>Start date</strong> picker at the top of the Phases panel. The end date next to it updates from the phase durations.</li>
              </ul>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Understanding Phase Elements</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Graphic Bars:</strong> Next to each phase, a colored graphic bar visually indicates the proportion of total project hours or budget consumed by this phase relative to others.</li>
                <li><strong>Phase Summaries:</strong> At the bottom of each phase block, a summary shows the total hours allocated within that specific phase, the blended hourly rate, and the total cost/revenue generated just by that phase.</li>
              </ul>
              <img src="/screenshots/projects-phases.jpg?v=20261016" alt="Projects and Phases screen showing a project's phase list with durations and the live payment schedule" className="w-full rounded-xl border border-ink-200 dark:border-ink-800 my-6 shadow-sm" />
            </div>
          </section>

          <hr className="border-ink-200 dark:border-ink-800" />

          {/* Section 4: Drag Resources */}
          <section id="drag-resources" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                <GripHorizontal size={24} className="text-warning-600 dark:text-warning-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">4. Drag & Drop Resources</h2>
            </div>
            
            <div className="prose prose-ink dark:prose-invert max-w-none text-ink-600 dark:text-ink-400">
              <p>
                The core of the calculation happens by assigning your Team Resources to your Phases.
              </p>
              <ol className="list-decimal pl-5 space-y-2 mt-4">
                <li>Open a Project to view your Phases.</li>
                <li>On the right side of the screen, you will see your <strong>Team Pool</strong>.</li>
                <li>Click the drag handle (six dots) next to a team member and <strong>drag them into the drop zone</strong> of a specific Phase.</li>
                <li>Once dropped, an Allocation row appears. Enter the number of hours this person will work during this phase.</li>
              </ol>
              <img src="/screenshots/fee-proposal.jpg?v=20261016" alt="Fee Proposal canvas with the team pool sidebar on the left and phase drop zones on the right" className="w-full rounded-xl border border-ink-200 dark:border-ink-800 my-6 shadow-sm" />

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Duplicating Resources Across Phases</h4>
              <p>
                To speed up data entry for recurring costs or team members who work across multiple stages, use the quick-duplicate actions:
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Hover over any allocated team member or cost chip inside a phase lane to reveal the action menu grid on the right side.</li>
                <li><strong>Duplicate to Next Phase (Right Arrow):</strong> Instantly copies the exact allocation (person and hours) or cost into the immediately following chronological phase.</li>
                <li><strong>Duplicate to All Phases (Stack Icon):</strong> Copies the allocation or cost into <em>every</em> other phase in the project simultaneously.</li>
                <li><strong>Edit (Pencil) / Delete (Trash):</strong> Modify the hours or remove the allocation entirely from that phase.</li>
              </ul>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">When a Team Member Is Removed</h4>
              <p>
                Deleting someone from Team Resources does not change proposals they were allocated to. Their chips stay in place with a dashed amber outline and a warning icon, labelled as a former team member, and their hours are still costed at the rate recorded when they were allocated. Reassign or remove those chips when you re-price the proposal.
              </p>
            </div>
          </section>

          <hr className="border-ink-200 dark:border-ink-800" />

          {/* Section 5: Fee Proposal Creation */}
          <section id="fee-proposal" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
                <Calculator size={24} className="text-accent-600 dark:text-accent-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">5. Fee Proposal Creation</h2>
            </div>
            
            <div className="prose prose-ink dark:prose-invert max-w-none text-ink-600 dark:text-ink-400">
              <p>
                As you drag resources into phases and allocate hours, the system is performing a <strong>bottom-up calculation</strong> in real-time.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4">
                <li><strong>Bottom-Up Method:</strong> Instead of guessing a flat fee and hoping it covers your costs, you calculate exactly how much time the project needs.</li>
                <li><strong>Real-time Totals:</strong> The <em>Fee Proposal</em> tab aggregates every hour allocated across all phases, multiplies them by the external billing rates, and presents the final recommended fee to charge the client.</li>
                <li><strong>Fixed fee:</strong> When a client has agreed a set amount, switch on <strong>Fixed</strong> next to <em>Total fee</em> and click the fee to type it. The profit margin is then calculated as (fee − cost) ÷ cost and turns red if costs exceed the fee. Phase fees, the payment schedule, documents and exports are scaled so they add up to the fixed amount. Switch it off to go back to cost + margin.</li>
                <li><strong>Jump to the project:</strong> Click the project name at the top of the Fee Proposal canvas to open that project in <em>Projects &amp; Phases</em>.</li>
              </ul>

              <div className="mt-6 bg-accent-50 dark:bg-accent-900/10 border border-accent-200 dark:border-accent-800/50 rounded-2xl p-6">
                <h5 className="font-bold text-accent-900 dark:text-accent-300 mb-2">Rates are locked in when you allocate</h5>
                <p className="text-sm">
                  Each time you drag a team member into a phase (or reassign an allocation to someone else), the app
                  records their hourly cost <em>at that moment</em>. If that person&apos;s salary or overhead changes
                  later on Team Resources, open proposals keep showing the original rate &mdash; so a proposal you
                  already sent to a client doesn&apos;t silently change.
                </p>
                <p className="text-sm mt-3">
                  If you <em>do</em> want a project to reflect updated team costs (for example, re-pricing a Draft
                  proposal before sending it), admins can click the <RefreshCw size={13} className="inline -mt-0.5" /> <strong>Refresh Rates</strong> icon
                  next to <em>Total Cost</em> on the Fee Proposal Canvas to re-pull everyone&apos;s current rate into
                  that project.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-ink-200 dark:border-ink-800" />

          
          {/* Section: Project Planning */}
          <div id="project-planning" className="pt-24 -mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-100 dark:bg-accent-900/50 rounded-lg">
                <CalendarCheck className="text-accent-600 dark:text-accent-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Project Planning & Timeline</h2>
            </div>
            <div className="bg-white dark:bg-ink-900 p-8 rounded-2xl border border-ink-200 dark:border-ink-800">
              <p className="text-ink-600 dark:text-ink-400 mb-6">
                The <strong className="text-ink-800 dark:text-ink-200">Project Planning</strong> feature allows you to translate your estimated fee hours into a concrete schedule on a timeline.
              </p>
              
              <div className="space-y-6">
                <div>
                                    <img src="/screenshots/wiki-planning.jpg?v=20261016" alt="Project Planning Gantt view showing team members assigned to a weekly timeline with budgeted vs planned cost" className="w-full rounded-xl border border-ink-200 dark:border-ink-800 my-6 shadow-sm" />
                  <h3 className="text-lg font-bold text-ink-800 dark:text-ink-200 mb-2">Generating Tasks</h3>
                  <p className="text-ink-600 dark:text-ink-400 mb-3">
                    When you first open a project in the Planner, you can click <strong className="text-accent-600 dark:text-accent-400">Sync Budget</strong> to instantly create tasks for every team member allocated in the Fee Calculator, distributed across the correct phases.
                    <br /><br />
                    If you manually change task durations and want to reset your schedule to match your budget perfectly, click the new <strong className="text-negative-600 dark:text-negative-400">Reset to Budget</strong> button next to the Sync button.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-ink-50 dark:bg-ink-800/50 p-4 rounded-xl border border-ink-200 dark:border-ink-700">
                    <h4 className="font-bold text-ink-800 dark:text-ink-200 mb-2 text-sm flex items-center gap-2">
                      <GripHorizontal size={14} className="text-ink-500" />
                      Interactive Gantt
                    </h4>
                    <p className="text-xs text-ink-600 dark:text-ink-400">
                      Drag tasks left and right to change their start date. Drag the edges to extend or reduce their duration. Click the edit icon to manually change dates or skip weekends.
                    </p>
                  </div>
                  <div className="bg-ink-50 dark:bg-ink-800/50 p-4 rounded-xl border border-ink-200 dark:border-ink-700">
                    <h4 className="font-bold text-ink-800 dark:text-ink-200 mb-2 text-sm flex items-center gap-2">
                      <Calculator size={14} className="text-ink-500" />
                      Budget Syncing
                    </h4>
                    <p className="text-xs text-ink-600 dark:text-ink-400">
                      The planner header compares your planned hours against the budget from the Fee Proposal. Click the <strong className="text-positive-500">Sync Budget</strong> button to overwrite the Fee Proposal with your exact planned hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          
          
          {/* Section: Data Security & Compliance */}
          <div id="security-compliance" className="pt-24 -mt-24 mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-positive-100 dark:bg-positive-900/50 rounded-lg">
                <ShieldAlert className="text-positive-600 dark:text-positive-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Data Security & Compliance</h2>
            </div>
            <div className="bg-white dark:bg-ink-900 p-8 rounded-2xl border border-ink-200 dark:border-ink-800">
              <p className="text-ink-600 dark:text-ink-400 mb-6">
                We know that financial estimates and salary data are highly sensitive. Fee Calculator uses enterprise-grade security to ensure your data is isolated, encrypted, and strictly access-controlled.
              </p>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-ink-50 dark:bg-ink-800/50 p-4 rounded-xl border border-ink-200 dark:border-ink-700">
                    <h4 className="font-bold text-ink-800 dark:text-ink-200 mb-2 text-sm flex items-center gap-2">
                      <Building size={14} className="text-ink-500" />
                      Strict Tenant Isolation
                    </h4>
                    <p className="text-xs text-ink-600 dark:text-ink-400">
                      Every database query is strictly filtered by your unique <code className="bg-ink-200 dark:bg-ink-700 px-1 py-0.5 rounded">companyId</code>. Our Firebase Security Rules explicitly deny any read or write request that attempts to access data outside of your authenticated company workspace.
                    </p>
                  </div>
                  <div className="bg-ink-50 dark:bg-ink-800/50 p-4 rounded-xl border border-ink-200 dark:border-ink-700">
                    <h4 className="font-bold text-ink-800 dark:text-ink-200 mb-2 text-sm flex items-center gap-2">
                      <Users size={14} className="text-ink-500" />
                      Role-Based Access
                    </h4>
                    <p className="text-xs text-ink-600 dark:text-ink-400">
                      Even within your company, data is governed by roles. <strong className="text-ink-700 dark:text-ink-300">Admins</strong> can view and modify global rates, while standard <strong className="text-ink-700 dark:text-ink-300">Members</strong> can only create project proposals based on those rates.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Document Builder */}
          <div id="document-builder" className="pt-24 -mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent-100 dark:bg-accent-900/50 rounded-lg">
                <FileText className="text-accent-600 dark:text-accent-400" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">Document Builder</h2>
            </div>
            <div className="bg-white dark:bg-ink-900 p-8 rounded-2xl border border-ink-200 dark:border-ink-800">
              <p className="text-ink-600 dark:text-ink-400 mb-6">
                The <strong className="text-ink-800 dark:text-ink-200">Document Builder</strong> automatically turns your Fee Proposal data into a professional document ready to send to clients.
              </p>
              <img src="/screenshots/wiki-document-builder.jpg?v=20261016" alt="Document Builder showing a generated fee proposal with project scope and financial summary blocks" className="w-full rounded-xl border border-ink-200 dark:border-ink-800 my-6 shadow-sm" />
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-ink-50 dark:bg-ink-800/50 p-4 rounded-xl border border-ink-200 dark:border-ink-700">
                    <h4 className="font-bold text-ink-800 dark:text-ink-200 mb-2 text-sm">Modular Blocks</h4>
                    <p className="text-xs text-ink-600 dark:text-ink-400">
                      Mix and match rich text blocks with dynamic tables. Reorder them using drag-and-drop to customize the exact flow of your proposal.
                    </p>
                  </div>
                  <div className="bg-ink-50 dark:bg-ink-800/50 p-4 rounded-xl border border-ink-200 dark:border-ink-700">
                                        <h4 className="font-bold text-ink-800 dark:text-ink-200 mb-2 text-sm flex items-center gap-2">
                      <Bookmark size={14} className="text-positive-500" />
                      Saved Templates
                    </h4>
                    <p className="text-xs text-ink-600 dark:text-ink-400">
                      Save any text block as a template by clicking its bookmark icon. Your templates appear in the left sidebar and can be dragged and dropped directly into your proposals!
                    </p>
                  </div>
                  <div className="bg-ink-50 dark:bg-ink-800/50 p-4 rounded-xl border border-ink-200 dark:border-ink-700">
                    <h4 className="font-bold text-ink-800 dark:text-ink-200 mb-2 text-sm flex items-center gap-2">
                      <Download size={14} className="text-ink-500" />
                      Export to Word & PDF
                    </h4>
                    <p className="text-xs text-ink-600 dark:text-ink-400">
                      Download a native Microsoft Word <code>.docx</code> document or a beautiful multi-page PDF to send directly to your clients.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 6: Financial Summary */}
          <section id="financial-summary" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-positive-100 dark:bg-positive-900/30 rounded-lg">
                <FileSpreadsheet size={24} className="text-positive-600 dark:text-positive-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">6. Financial Summary Info</h2>
            </div>
            
            <div className="prose prose-ink dark:prose-invert max-w-none text-ink-600 dark:text-ink-400">
              <p>
                The Financial Summary panel is the most important dashboard for understanding project profitability.
              </p>
              <img src="/screenshots/fee-proposal.jpg?v=20261016" alt="Fee Proposal header showing Total Cost, Profit Margin, and Total Fee for a project" className="w-full rounded-xl border border-ink-200 dark:border-ink-800 my-6 shadow-sm" />
              
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="p-4 border border-ink-200 dark:border-ink-700 rounded-xl">
                  <h5 className="font-bold text-ink-900 dark:text-ink-50 mb-2">Total Internal Cost</h5>
                  <p className="text-sm">The sum of all allocated hours multiplied by their respective <strong>Internal Rates</strong>. This is exactly what the project costs your company to execute.</p>
                </div>
                <div className="p-4 border border-ink-200 dark:border-ink-700 rounded-xl">
                  <h5 className="font-bold text-ink-900 dark:text-ink-50 mb-2">Total External Fee</h5>
                  <p className="text-sm">The sum of all allocated hours multiplied by their respective <strong>External Rates</strong>. This is what you charge the client.</p>
                </div>
                <div className="p-4 border border-ink-200 dark:border-ink-700 rounded-xl">
                  <h5 className="font-bold text-ink-900 dark:text-ink-50 mb-2">Gross Profit</h5>
                  <p className="text-sm">The difference between the External Fee and the Internal Cost. Your actual monetary gain.</p>
                </div>
                <div className="p-4 border border-ink-200 dark:border-ink-700 rounded-xl">
                  <h5 className="font-bold text-ink-900 dark:text-ink-50 mb-2">Margin (%)</h5>
                  <p className="text-sm">The Gross Profit expressed as a percentage of the External Fee. High margins indicate healthy profitability.</p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-ink-200 dark:border-ink-800" />

          {/* Section 7: Payments */}
          <section id="payments-schedules" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
                <CalendarCheck size={24} className="text-accent-600 dark:text-accent-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">7. Payments & Schedules</h2>
            </div>
            
            <div className="prose prose-ink dark:prose-invert max-w-none text-ink-600 dark:text-ink-400">
              <p>
                Once your total Fee Proposal is calculated, you must structure how the client pays you. 
              </p>
              <img src="/screenshots/projects-phases.jpg?v=20261016" alt="Payment Schedule panel showing milestones, their percentages, and estimated dollar amounts" className="w-full rounded-xl border border-ink-200 dark:border-ink-800 my-6 shadow-sm" />
              
              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Payment Creation & Editing</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Inside your Project view, locate the <strong>Payment Schedule</strong> section.</li>
                <li>You can add payments manually by specifying a name, a target date, and a percentage of the total fee.</li>
                <li>The system will automatically convert that percentage into a monetary value based on the total project fee calculated in Step 5.</li>
                <li><strong>Fixed amounts:</strong> Switch the schedule from <em>% of fee</em> to <em>Fixed amounts</em> to type each milestone as an amount instead. Its percentage is then calculated from the fee, and the total shows how much is allocated out of the fee. Switching converts the existing milestones at today&apos;s values.</li>
                <li><strong>Clear:</strong> Removes every milestone, for example after applying a preset you don&apos;t want.</li>
              </ol>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Payment Templates</h4>
              <p>
                If you use standard billing structures (e.g., 20% upfront, 50% at schematic design, 30% on delivery), use Templates to save time!
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Generate from Templates:</strong> Click "Apply Template" to instantly populate your schedule using standard industry templates.</li>
                <li><strong>Save Custom Templates:</strong> Build your perfect schedule and click "Save as Template". It will be saved securely under your company profile for your whole team to use on future projects.</li>
              </ul>
            </div>
          </section>

          <hr className="border-ink-200 dark:border-ink-800" />

          {/* Section 8: Global Preferences */}
          <section id="global-preferences" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-ink-100 dark:bg-ink-800/80 rounded-lg">
                <Settings size={24} className="text-ink-600 dark:text-ink-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">8. Global Preferences</h2>
            </div>
            
            <div className="prose prose-ink dark:prose-invert max-w-none text-ink-600 dark:text-ink-400">
              <p>
                You can customize the platform to suit your company's region by setting global preferences. These settings propagate instantly across all of your projects, team members, and fee proposals.
              </p>
              <img src="/screenshots/wiki-settings.jpg?v=20261016" alt="Settings page General Preferences tab showing currency and area unit options" className="w-full rounded-xl border border-ink-200 dark:border-ink-800 my-6 shadow-sm" />
              
              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Changing Currency & Units</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Navigate to the <strong>Settings</strong> page from the main navigation sidebar.</li>
                <li>Select the <strong>General Preferences</strong> tab.</li>
                <li><strong>Currency:</strong> Choose your preferred currency from a wide range of international options (e.g., USD, EUR, GBP, AUD, JPY, CNY). The platform will automatically format all costs using the correct symbols and regional separators.</li>
                <li><strong>Area Unit:</strong> Select whether your architectural projects are measured in <strong>Square Meters (sqm)</strong> or <strong>Square Feet (sqft)</strong>.</li>
              </ol>
            </div>
          </section>

          <hr className="border-ink-200 dark:border-ink-800" />

          {/* Section 9: Best Practices: Calculating Overheads */}
          <section id="calculating-overheads" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-negative-100 dark:bg-negative-900/30 rounded-lg">
                <Building size={24} className="text-negative-600 dark:text-negative-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">9. Best Practices: Calculating Overheads</h2>
            </div>
            
            <div className="prose prose-ink dark:prose-invert max-w-none text-ink-600 dark:text-ink-400">
              <div className="p-4 bg-positive-50 dark:bg-positive-900/20 rounded-xl border border-positive-200 dark:border-positive-800/50 mt-6 mb-6">
                <h5 className="font-bold text-positive-900 dark:text-positive-300 mb-2">Automate this with our Overheads Calculator!</h5>
                <p className="text-sm text-positive-800 dark:text-positive-400 mb-0">
                  Head to the <strong>Overheads Calculator</strong> tab in the sidebar. You can input all your non-billable time and expenses, and the app will automatically calculate your total running costs and sync the overhead rates directly to your Team Members!
                </p>
              </div>

              <p>
                To accurately set your team's <strong>Internal Rate</strong>, you must calculate your true cost of doing business. Your internal rate is not just a person's raw salary; it must include their share of the company's overhead expenses.
              </p>
              <img src="/screenshots/overheads.jpg?v=20261016" alt="Overheads Calculator showing expense categories, non-billable time, and the resulting cost multiplier" className="w-full rounded-xl border border-ink-200 dark:border-ink-800 my-6 shadow-sm" />

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">1. Expense Categories to Consider</h4>
              <p>When calculating total annual overhead, ensure you include these often-missed categories:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Office & Facilities:</strong> Rent, utilities, cleaning services, maintenance, and physical security.</li>
                <li><strong>Technology & IT:</strong> Software subscriptions (e.g., BIM, Adobe, Microsoft 365, Enzyme APD), cloud storage, and IT support services.</li>
                <li>
                  <strong>Hardware & Depreciation:</strong> When you buy expensive equipment like workstations or servers, don't account for the entire cost in a single month! Instead, calculate its <em>depreciation</em>. 
                  For example, if a $3,000 laptop is expected to last 3 years, its yearly cost burden is $1,000/year. Add this $1,000 as a yearly expense in your Overheads Calculator rather than a one-time lump sum to keep your rates stable.
                </li>
                <li><strong>Professional Expenses:</strong> Professional liability insurance, business insurance, industry memberships, certifications, and accounting/legal fees.</li>
                <li><strong>Business Development:</strong> Marketing budgets, travel for BD trips, conference tickets, client entertainment, and website hosting.</li>
                <li><strong>Employee Benefits:</strong> Health insurance, retirement contributions, training budgets, and team building events.</li>
              </ul>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">2. Factoring in Non-Billable Hours</h4>
              <p>Your team members are not 100% billable. They take time off and perform internal tasks that clients do not pay for. You must distribute the cost of these non-billable hours across the billable hours.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Leave & Holidays:</strong> Paid time off, sick leave, and public holidays.</li>
                <li><strong>Internal Admin:</strong> Timesheet entry, performance reviews, general staff meetings, and email management.</li>
                <li><strong>Management Time:</strong> Directors and managers spend significant time mentoring, reviewing company strategy, or doing non-project-specific QA.</li>
                <li><strong>Business Development:</strong> Time spent drafting proposals, pitching, and networking.</li>
              </ul>
              
              <div className="p-4 bg-accent-50 dark:bg-accent-900/20 rounded-xl border border-accent-200 dark:border-accent-800/50 mt-6">
                <h5 className="font-bold text-accent-900 dark:text-accent-300 mb-2">The Golden Formula</h5>
                <p className="text-sm text-accent-800 dark:text-accent-400 mb-0">
                  <code>Internal Rate = (Annual Salary + Proportion of Overheads) / Target Billable Hours per Year</code>
                </p>
                <p className="text-sm text-accent-800 dark:text-accent-400 mt-2">
                  By factoring in non-billable hours to reduce the denominator, and adding overheads to the numerator, your Internal Rate will accurately reflect the true break-even cost for every hour a team member spends on a project.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-ink-200 dark:border-ink-800" />

          {/* Section 10: Financial Forecast */}
          <section id="financial-forecast" className="scroll-mt-32">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-accent-100 dark:bg-accent-900/30 rounded-lg">
                <TrendingUp size={24} className="text-accent-600 dark:text-accent-400" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900 dark:text-ink-50">10. Financial Forecast</h2>
            </div>

            <div className="prose prose-ink dark:prose-invert max-w-none text-ink-600 dark:text-ink-400">
              <p>
                The <strong>Financial Forecast</strong> is a month-by-month cash plan: money coming in from projects and other income, money going out on salaries, overheads and other costs, and the bank balance that results. It is visible to admins only, because it includes internal salaries and overheads. Every change saves automatically and is shared with the other admins in your company.
              </p>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">How the Table Works</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Months and stages:</strong> Each month has three columns. <em>Invoiced</em> is your invoicing schedule: every invoice you send that month. It is for reference and never counts as cash. <em>Possible</em> is money that may come in that month, and <em>Collections</em> is money you expect to receive. To forecast a payment, copy the invoice (Alt+drag) into Collections or Possible in the month you expect it. The last column totals the months on screen.</li>
                <li><strong>Amounts are pills:</strong> Click the + in a cell to add an amount, click a pill to edit it, and drag a pill to move it to another month, stage or row. Hold <strong>Alt</strong> (Option on a Mac) while dragging to copy it instead.</li>
                <li><strong>Scenarios:</strong> <em>Conservative</em> counts collections only, <em>Expected</em> adds Possible amounts weighted by the percentage at the top, and <em>Optimistic</em> adds all Possible amounts in full. Invoiced amounts are never included.</li>
                <li><strong>Bank cash:</strong> Enter your opening bank cash and the month it applies to. Each month&apos;s closing cash is the previous balance plus collections minus outflows.</li>
              </ul>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Inflows</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Sync projects:</strong> Adds your Active and Proposed projects, placing each payment milestone as an invoice in the month its phase reaches it. You then decide when each invoice is likely to be paid by copying it to Collections or Possible. Under each synced row you can see its fee, how much has been invoiced (with any over or under invoicing), and what is in Collections and Possible. Rows already in the forecast are left as they are.</li>
                <li><strong>Reset row:</strong> Rebuilds a synced row from its current fee proposal and payment schedule (or clears a manual row). Use it after changing a proposal.</li>
                <li><strong>Add income:</strong> Adds a manual row for retainers, partnerships or any income that isn&apos;t a fee proposal. Rows are marked <em>Proposal</em> (synced) or <em>Manual</em>.</li>
                <li><strong>Referral commissions:</strong> Give a pill a referral name and percentage and the commission appears automatically as an outflow line in the month the money is collected.</li>
              </ul>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Outflows</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Running costs:</strong> Linked by default to your internal team&apos;s monthly salaries (Team Resources, external categories excluded) plus active overhead items divided by 12 (Overheads Calculator), and updated whenever those pages change. Use the <strong>± adjust</strong> box to correct a single month, or <strong>Unlink</strong> to type amounts yourself.</li>
                <li><strong>Other lines:</strong> Click <strong>Add outflow</strong> on the Outflows bar for debt repayments, profit shares or any other cost. Click a line&apos;s name to rename it. Add expenses to a month with its <strong>+</strong>: each one has an amount and an optional description, shown as a preview in the cell. Several expenses in a month add up. Click an expense to edit it, drag it to another month or line, or hold <strong>Alt</strong> while dragging to copy it.</li>
              </ul>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Groups</h4>
              <p>Groups let you organise lines by country, office or anything else, for example India and Spain.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Creating groups:</strong> Click <strong>Groups</strong> in the top bar to add, rename, recolour (15 colours), reorder or delete groups, or create one directly from a row&apos;s edit dialog. Groups are shared with your team.</li>
                <li><strong>Assigning lines:</strong> Choose the group in an income row&apos;s add or edit dialog, or from the small group menu under an outflow line&apos;s name. Dragging an income row onto a row in another group moves it into that group. The <strong>+</strong> on a group bar adds a new income row or outflow line straight into that group.</li>
                <li><strong>Subtotals and collapsing:</strong> Only groups with lines in that section are shown, so Inflows and Outflows can use different groups. Each group has its own bar with subtotals per month and stage. Click it to fold the group away; the subtotals stay visible.</li>
                <li><strong>Excluding a group:</strong> Click <strong>Included</strong> on a group bar to take that group out of every total, scenario and bank balance, so you can see its effect. Its lines turn grey and a banner lists what is excluded. This only affects your screen and is never saved; click <strong>Include all</strong> or reload the page to restore everything.</li>
              </ul>

              <h4 className="font-bold text-ink-900 dark:text-ink-200 mt-6 mb-2">Arranging the View</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Collapse the <strong>Inflows</strong> or <strong>Outflows</strong> sections from their bars; totals stay visible.</li>
                <li>Use <strong>Hide empty rows</strong> to show only rows with amounts in the months on screen, and <strong>Hide notes</strong> to narrow the left column.</li>
                <li>Reorder rows by dragging the handle beside the name or with the up and down arrows.</li>
                <li>Click a synced row&apos;s name to open the project in <em>Projects &amp; Phases</em>, or <strong>Proposal</strong> to open its fee proposal.</li>
                <li>These view choices are remembered in your browser and don&apos;t affect what other admins see.</li>
              </ul>

              <div className="mt-6 bg-accent-50 dark:bg-accent-900/10 border border-accent-200 dark:border-accent-800/50 rounded-2xl p-6">
                <h5 className="font-bold text-accent-900 dark:text-accent-300 mb-2">Saving and working together</h5>
                <p className="text-sm">
                  Changes save about a second after you make them. If a save fails, a red <em>Couldn&apos;t save</em> message appears in the top bar, and the browser warns you before you leave with unsaved changes. Each open page saves the whole forecast, so if several admins edit at once, refresh before making changes to avoid overwriting each other&apos;s work.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
