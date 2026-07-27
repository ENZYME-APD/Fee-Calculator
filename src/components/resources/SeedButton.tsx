import React, { useState } from 'react';
import { addTeamMember } from '@/lib/firebase/db';
import { Database } from 'lucide-react';

const TEAM_DATA = [
  { name: 'Jorge Beneitez', position: 'Partner', type: 'Employee', salary: 8397, overheads: 2472, costPerHour: 67.85, roundedFeeHour: 155, currency: 'USD', category: 'MANAGEMENT' },
  { name: 'Eugenio Fontan', position: 'Partner', type: 'Employee', salary: 8397, overheads: 2472, costPerHour: 67.85, roundedFeeHour: 155, currency: 'USD', category: 'MANAGEMENT' },
  { name: 'Jorge Gil', position: 'Partner', type: 'Employee', salary: 8397, overheads: 2472, costPerHour: 67.85, roundedFeeHour: 155, currency: 'USD', category: 'MANAGEMENT' },
  { name: 'Simon N.A.F.', position: 'Partner', type: 'Employee', salary: 8397, overheads: 2472, costPerHour: 67.85, roundedFeeHour: 155, currency: 'USD', category: 'MANAGEMENT' },
  { name: 'Marcelo Morim', position: 'Partner', type: 'Employee', salary: 8397, overheads: 2472, costPerHour: 67.85, roundedFeeHour: 155, currency: 'USD', category: 'MANAGEMENT' },
  { name: 'Ben See', position: 'Sr. Associate', type: 'Employee', salary: 6795, overheads: 2472, costPerHour: 57.85, roundedFeeHour: 95, currency: 'USD', category: 'TEAM GLOBAL' },
  { name: 'Patricia Segado', position: 'Sr. Associate', type: 'Employee', salary: 3862, overheads: 2472, costPerHour: 39.54, roundedFeeHour: 95, currency: 'USD', category: 'TEAM GLOBAL' },
  { name: 'Melissa Chan', position: 'Associate', type: 'Employee', salary: 4487, overheads: 2472, costPerHour: 43.44, roundedFeeHour: 75, currency: 'USD', category: 'TEAM GLOBAL' },
  { name: 'Hendriko', position: 'Computational Designer', type: 'Employee', salary: 3141, overheads: 2472, costPerHour: 35.04, roundedFeeHour: 50, currency: 'USD', category: 'TEAM GLOBAL' },
  { name: 'Felicia Kasamira', position: 'Architectural Designer', type: 'Employee', salary: 1006, overheads: 2472, costPerHour: 21.71, roundedFeeHour: 25, currency: 'USD', category: 'TEAM GLOBAL' },
  { name: 'Abiasa', position: 'Architectural Designer', type: 'Employee', salary: 372, overheads: 2472, costPerHour: 17.76, roundedFeeHour: 10, currency: 'USD', category: 'TEAM JAKARTA' },
  { name: 'Tonny', position: 'Architectural Designer', type: 'Employee', salary: 372, overheads: 2472, costPerHour: 17.76, roundedFeeHour: 10, currency: 'USD', category: 'TEAM JAKARTA' },
  { name: 'Monique', position: 'Architectural Designer', type: 'Employee', salary: 403, overheads: 2472, costPerHour: 17.94, roundedFeeHour: 10, currency: 'USD', category: 'TEAM JAKARTA' },
  { name: 'Genny Russian', position: 'Junior Designer', type: 'Consultant', salary: 1538, overheads: 0, costPerHour: 9.60, roundedFeeHour: 120, currency: 'USD', category: 'CONSULTANTS' },
  { name: 'Natalie Lewis', position: 'Associate Director ID', type: 'Consultant', salary: 7692, overheads: 0, costPerHour: 48.02, roundedFeeHour: 120, currency: 'USD', category: 'CONSULTANTS' },
  { name: 'Ed Peters', position: 'Associate Director ID', type: 'Consultant', salary: 10256, overheads: 0, costPerHour: 64.02, roundedFeeHour: 175, currency: 'USD', category: 'CONSULTANTS' },
  { name: 'Alberto Cipriani', position: 'Associate', type: 'Consultant', salary: 3205, overheads: 0, costPerHour: 20.01, roundedFeeHour: 155, currency: 'USD', category: 'CONSULTANTS' },
  { name: 'Isma Sanz', position: 'Senior Computational Designer', type: 'Consultant', salary: 7692, overheads: 0, costPerHour: 48.02, roundedFeeHour: 155, currency: 'USD', category: 'CONSULTANTS' },
  { name: 'Ricardo Diaz Garim', position: 'BIM Arch', type: 'Consultant', salary: 5128, overheads: 0, costPerHour: 32.01, roundedFeeHour: 75, currency: 'USD', category: 'CONSULTANTS' },
  { name: 'Grzegorz Wilk', position: 'Sr. GDL Programmer', type: 'Consultant', salary: 2692, overheads: 0, costPerHour: 16.81, roundedFeeHour: 75, currency: 'USD', category: 'CONSULTANTS' },
];

export function SeedButton({ onComplete }: { onComplete: () => void }) {
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    if (!confirm('This will add 20 team members from the Google Sheet into Firestore. Continue?')) return;
    setSeeding(true);
    try {
      await Promise.all(TEAM_DATA.map(member => addTeamMember(member)));
      onComplete();
    } catch (e) {
      console.error(e);
      alert('Error seeding data');
    }
    setSeeding(false);
  };

  return (
    <button 
      onClick={handleSeed}
      disabled={seeding}
      className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
    >
      <Database size={16} />
      {seeding ? 'Seeding...' : 'Seed Data'}
    </button>
  );
}
