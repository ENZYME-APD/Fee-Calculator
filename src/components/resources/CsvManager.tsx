import React, { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { batchAddTeamMembers, getTeamMembers, getCategories } from '@/lib/firebase/db';
import { TeamMember } from '@/lib/firebase/schema';

interface CsvManagerProps {
  onComplete: () => void;
}

export function CsvManager({ onComplete }: CsvManagerProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ['Name', 'Position', 'Category', 'Salary', 'Overheads', 'Currency'];
    const sampleRows = [
      ['John Doe', 'Senior Architect', 'MANAGEMENT', '8000', '1000', 'USD'],
      ['Jane Smith', 'BIM Modeler', 'GLOBAL', '4500', '500', 'USD'],
      ['Bob Consultant', 'Structural Engineer', 'CONSULTANTS', '10000', '0', 'USD']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'team_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadFullTeam = async () => {
    setLoading(true);
    try {
      const [members, categories] = await Promise.all([
        getTeamMembers(),
        getCategories()
      ]);
      
      const headers = ['Name', 'Position', 'Category', 'Salary', 'Overheads', 'Currency', 'Cost/Hr', 'Fee/Hr'];
      
      const rows = members.map(m => {
        const catName = categories.find(c => c.id === m.category)?.name || (m.category === 'UNCATEGORIZED' ? 'Uncategorized' : m.category);
        return [
          `"${m.name || ''}"`, 
          `"${m.position || ''}"`, 
          `"${catName}"`, 
          m.salary?.toString() || '0', 
          m.overheads?.toString() || '0', 
          m.currency || 'USD',
          m.costPerHour?.toString() || '0',
          m.roundedFeeHour?.toString() || '0'
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'team_members_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Failed to download team list');
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 2) {
          alert('CSV file is empty or missing data rows.');
          setLoading(false);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const newMembers: Omit<TeamMember, 'id' | 'companyId'>[] = [];

        for (let i = 1; i < lines.length; i++) {
          // Simple CSV parse handling comma separation
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length < headers.length) continue;

          const member: any = {};
          headers.forEach((header, index) => {
            member[header] = cols[index];
          });

          if (!member.name) continue;

          const salary = parseFloat(member.salary) || 0;
          const overheads = parseFloat(member.overheads) || 0;
          const costPerHour = (salary + overheads) / 160;
          const roundedFeeHour = costPerHour * 2.5;

          newMembers.push({
            name: member.name || 'Unknown',
            position: member.position || '',
            category: member.category || 'UNCATEGORIZED',
            type: 'Employee', // Hardcode or remove, backend requires it in schema but we ignore it in UI
            salary,
            overheads,
            currency: member.currency || 'USD',
            costPerHour: parseFloat(costPerHour.toFixed(2)),
            roundedFeeHour: parseFloat(roundedFeeHour.toFixed(2))
          });
        }

        if (newMembers.length > 0) {
          await batchAddTeamMembers(newMembers);
          onComplete();
        } else {
          alert('No valid rows found to import.');
        }
      } catch (error) {
        console.error('Error parsing CSV', error);
        alert('Failed to parse CSV file.');
      }
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={downloadTemplate}
        disabled={loading}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 text-sm"
      >
        <Download size={16} />
        Template
      </button>

      <button 
        onClick={downloadFullTeam}
        disabled={loading}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 text-sm"
      >
        <Download size={16} />
        Export CSV
      </button>

      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2 text-sm"
      >
        <Upload size={16} />
        {loading ? 'Uploading...' : 'Upload CSV'}
      </button>
    </div>
  );
}
