const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldHandleMemberChange = `  const handleMemberChange = async (id: string, nonBillablePercentage: number) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, nonBillablePercentage } : m));
    await updateTeamMember(id, { nonBillablePercentage });
  };`;

const newHandleMemberChange = `  const handleMemberChange = async (id: string, nonBillablePercentage: number, nonBillableDescription?: string) => {
    const update: any = { nonBillablePercentage };
    if (nonBillableDescription !== undefined) update.nonBillableDescription = nonBillableDescription;
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...update } : m));
    await updateTeamMember(id, update);
  };`;

code = code.replace(oldHandleMemberChange, newHandleMemberChange);
fs.writeFileSync(file, code);
