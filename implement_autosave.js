const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add useEffect for autosave
const oldHandleSave = `  const handleSave = async () => {`;
const newHandleSave = `  const initialLoadRef = useRef(true);
  
  useEffect(() => {
    if (loading) return;
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    
    const timer = setTimeout(() => {
      handleSave();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [yearlyIncomeTarget, workingHoursPerYear, categories]);

  const handleSave = async () => {`;
code = code.replace(oldHandleSave, newHandleSave);

// 2. Remove the "Save Profile" button
// It's located here:
//             <button 
//               onClick={handleSave}
//               disabled={saving}
//               className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
//             >
//               {saving ? 'Saving...' : 'Save Profile'}
//             </button>
const buttonRegex = /<button\s+onClick=\{handleSave\}[\s\S]*?\{saving \? 'Saving\.\.\.' : 'Save Profile'\}[\s\S]*?<\/button>/;
const savingIndicator = `
            {saving && <span className="text-sm font-bold text-slate-400 flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Saving...</span>}`;
code = code.replace(buttonRegex, savingIndicator);

fs.writeFileSync(file, code);
