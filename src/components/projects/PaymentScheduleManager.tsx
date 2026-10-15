"use client";
import React, { useState, useEffect } from 'react';
import { Allocation, Phase, Payment, ProjectCost, TeamMember } from '@/lib/firebase/schema';
import { getPayments, addPayment, updatePayment, deletePayment, batchAddPayments, clearPayments, batchUpdatePayments } from '@/lib/firebase/db';
import { FileSpreadsheet, Plus, Trash2, Pencil, Check, X, CalendarDays, Layers } from 'lucide-react';
import { RowMenu } from '@/components/ui/RowMenu';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { Card, CardHeader, CardBody, Row } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton, IconButton, fieldClass } from '@/components/ui/Button';
import { computePhaseCost } from '@/lib/utils/projectFinancials';

interface PaymentScheduleManagerProps {
  projectId: string;
  projectName?: string;
  phases: Phase[];
  allocations?: Allocation[];
  projectCosts?: ProjectCost[];
  teamMembers?: TeamMember[];
  totalFee?: number;
  formatCurrency?: (n: number) => string;
}

export const InlinePercentInput = ({ value, onChange, maxAllowed }: { value: number, onChange: (val: number) => void, maxAllowed?: number }) => {
  const [val, setVal] = useState(value.toString());
  
  useEffect(() => {
    setVal(value.toString());
  }, [value]);

  const handleBlur = () => {
    let num = parseFloat(val);
    if (!isNaN(num) && num !== value) {
      if (maxAllowed !== undefined && num > maxAllowed) {
        num = maxAllowed;
        setVal(num.toString());
      }
      onChange(num);
    } else {
      setVal(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center bg-ink-50 dark:bg-ink-800 rounded-md border border-ink-200 dark:border-ink-700 overflow-hidden focus-within:border-accent-400 focus-within:ring-1 focus-within:ring-accent-400 transition-colors">
      <input 
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-14 text-right bg-transparent text-sm font-bold text-ink-700 dark:text-ink-300 px-1 py-1 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none m-0"
      />
      <span className="text-ink-500 text-sm font-bold pr-2 flex-shrink-0">%</span>
    </div>
  );
};

export function PaymentScheduleManager({ projectId, projectName, phases, allocations = [], projectCosts = [], teamMembers = [], totalFee = 0, formatCurrency }: PaymentScheduleManagerProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // New Payment Form
  const [newName, setNewName] = useState('');
  const [newPercentage, setNewPercentage] = useState('');
  const [newPhaseId, setNewPhaseId] = useState(''); // empty string means independent

  // Edit Payment Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPercentage, setEditPercentage] = useState('');
  const [editPhaseId, setEditPhaseId] = useState('');

  // Context Menu
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const loadPayments = async () => {
    setLoading(true);
    const data = await getPayments(projectId);
    setPayments(data.sort((a, b) => a.order - b.order));
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPercentage) return;
    
    const parsedPercentage = parseFloat(newPercentage) || 0;
    if (totalPercentage + parsedPercentage > 100) {
      alert("Total percentage cannot exceed 100%");
      return;
    }
    
    await addPayment({
      projectId,
      phaseId: newPhaseId || undefined,
      name: newName.trim(),
      percentage: parsedPercentage,
      order: payments.length > 0 ? Math.max(...payments.map(p => p.order)) + 1 : 1
    });
    
    setNewName('');
    setNewPercentage('');
    setNewPhaseId('');
    await loadPayments();
  };

  const handleEditStart = (p: Payment) => {
    setEditingId(p.id!);
    setEditName(p.name);
    setEditPercentage(p.percentage.toString());
    setEditPhaseId(p.phaseId || '');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editName.trim()) {
      const currentPayment = payments.find(p => p.id === editingId);
      const parsedPercentage = parseFloat(editPercentage) || 0;
      const otherTotal = totalPercentage - (currentPayment?.percentage || 0);
      
      if (otherTotal + parsedPercentage > 100) {
        alert("Total percentage cannot exceed 100%");
        return;
      }
      
      await updatePayment(editingId, {
        name: editName.trim(),
        percentage: parseFloat(editPercentage) || 0,
        phaseId: editPhaseId || undefined
      });
      setEditingId(null);
      await loadPayments();
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Payment Stage',
      message: 'Are you sure you want to delete this payment stage? This action cannot be undone.',
      confirmText: 'Delete Payment',
      onConfirm: async () => {
        await deletePayment(id);
        await loadPayments();
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleAddBeforeAfter = async (targetPayment: Payment, position: 'before' | 'after') => {
    const newOrder = position === 'before' ? targetPayment.order - 0.5 : targetPayment.order + 0.5;
    await addPayment({
      projectId,
      phaseId: targetPayment.phaseId, // default to same phase
      name: 'New Payment',
      percentage: 0,
      order: newOrder
    });
    
    // Fetch and re-normalize orders
    const data = await getPayments(projectId);
    const sorted = data.sort((a, b) => a.order - b.order);
    
    const updates = sorted.map((p, index) => ({ id: p.id!, data: { order: index + 1 } }));
    await batchUpdatePayments(updates);
    
    await loadPayments();
  };

  const handleUseTemplate = async () => {
    const applyTemplate = async () => {
      await clearPayments(projectId);
    
    const newPayments: Omit<Payment, 'id' | 'companyId'>[] = [];
    let order = 1;
    
    // 1. Mobilisation
    newPayments.push({
      projectId,
      name: 'Mobilisation',
      percentage: 10,
      order: order++
    });
    
    // 2. Payments per phase
    if (phases.length > 0) {
      const remainingPercent = 85;
      const percentPerPhase = parseFloat((remainingPercent / phases.length).toFixed(2));
      
      // Sort phases to ensure correct chronological order
      const sortedPhases = [...phases].sort((a,b) => a.order - b.order);
      
      sortedPhases.forEach(phase => {
        newPayments.push({
          projectId,
          phaseId: phase.id,
          name: `Completion of ${phase.name}`,
          percentage: percentPerPhase,
          order: order++
        });
      });
      
      // Fix rounding error on the last phase to ensure exactly 85% is distributed
      const totalPhasePercent = percentPerPhase * phases.length;
      if (totalPhasePercent !== remainingPercent) {
        newPayments[newPayments.length - 1].percentage = parseFloat((percentPerPhase + (remainingPercent - totalPhasePercent)).toFixed(2));
      }
    }
    
    // 3. Final Approval
    newPayments.push({
      projectId,
      name: 'Final Approval',
      percentage: 5,
      order: order++
    });
    
    await batchAddPayments(newPayments);
      await loadPayments();
    };

    if (payments.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Replace Schedule',
        message: 'This will replace your current payment schedule. Are you sure you want to continue?',
        confirmText: 'Replace',
        onConfirm: async () => {
          await applyTemplate();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      await applyTemplate();
    }
  };

  const handleMonthlyTemplate = async () => {
    const applyTemplate = async () => {
      await clearPayments(projectId);
    
    const newPayments: Omit<Payment, 'id' | 'companyId'>[] = [];
    let order = 1;
    
    newPayments.push({
      projectId,
      name: 'Mobilisation',
      percentage: 10,
      order: order++
    });
    
    if (phases.length > 0) {
      const remainingPercent = 85; // Reserve 5% for final
      
      // Calculate total project duration to find weight of each phase
      const totalDuration = phases.reduce((sum, p) => sum + p.durationWeeks, 0);
      
      const sortedPhases = [...phases].sort((a,b) => a.order - b.order);
      
      sortedPhases.forEach(phase => {
        // Find how much of the 85% this phase gets based on duration length
        const phaseWeightPercent = totalDuration > 0 ? (phase.durationWeeks / totalDuration) * remainingPercent : 0;
        
        // Split into 4-week chunks (roughly 1 month)
        const numPayments = Math.max(1, Math.ceil(phase.durationWeeks / 4));
        const percentPerPayment = parseFloat((phaseWeightPercent / numPayments).toFixed(2));
        
        for (let i = 1; i <= numPayments; i++) {
          newPayments.push({
            projectId,
            phaseId: phase.id,
            name: `${phase.name} - Payment ${i}`,
            percentage: percentPerPayment,
            order: order++
          });
        }
      });
      
      // Fix global rounding error on the last phase payment
      const totalPhasePercent = newPayments.slice(1).reduce((sum, p) => sum + p.percentage, 0);
      if (totalPhasePercent !== remainingPercent && newPayments.length > 1) {
        newPayments[newPayments.length - 1].percentage = parseFloat((newPayments[newPayments.length - 1].percentage + (remainingPercent - totalPhasePercent)).toFixed(2));
      }
    }
    
    newPayments.push({
      projectId,
      name: 'Final Approval',
      percentage: 5,
      order: order++
    });
    
    await batchAddPayments(newPayments);
      await loadPayments();
    };

    if (payments.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Replace Schedule',
        message: 'This will replace your current payment schedule. Are you sure you want to continue?',
        confirmText: 'Replace',
        onConfirm: async () => {
          await applyTemplate();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      await applyTemplate();
    }
  };

  // No mobilisation/final split — one payment per phase, sized by that
  // phase's actual calculated cost (allocations + direct costs) rather than
  // an equal or duration-weighted split.
  const handleCostWeightedTemplate = async () => {
    const applyTemplate = async () => {
      await clearPayments(projectId);

      const sortedPhases = [...phases].sort((a, b) => a.order - b.order);
      const phaseCosts = sortedPhases.map(phase => computePhaseCost(phase.id!, allocations, projectCosts, teamMembers));
      const totalCost = phaseCosts.reduce((sum, c) => sum + c, 0);

      const newPayments: Omit<Payment, 'id' | 'companyId'>[] = sortedPhases.map((phase, i) => ({
        projectId,
        phaseId: phase.id,
        name: `Completion of ${phase.name}`,
        percentage: totalCost > 0 ? parseFloat(((phaseCosts[i] / totalCost) * 100).toFixed(2)) : parseFloat((100 / sortedPhases.length).toFixed(2)),
        order: i + 1,
      }));

      // Fix rounding so the schedule sums to exactly 100%.
      if (newPayments.length > 0) {
        const sum = newPayments.reduce((s, p) => s + p.percentage, 0);
        newPayments[newPayments.length - 1].percentage = parseFloat((newPayments[newPayments.length - 1].percentage + (100 - sum)).toFixed(2));
      }

      await batchAddPayments(newPayments);
      await loadPayments();
    };

    if (phases.length === 0) {
      alert('Add phases before applying a cost-weighted schedule.');
      return;
    }

    if (payments.length > 0) {
      setConfirmConfig({
        isOpen: true,
        title: 'Replace Schedule',
        message: 'This will replace your current payment schedule. Are you sure you want to continue?',
        confirmText: 'Replace',
        onConfirm: async () => {
          await applyTemplate();
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
      });
    } else {
      await applyTemplate();
    }
  };

  const totalPercentage = payments.reduce((sum, p) => sum + p.percentage, 0);

  if (loading) return <div className="p-8 flex-1 text-ink-500 flex items-center justify-center">Loading payments...</div>;

  return (
    <Card className="flex-1">
      <CardHeader className="bg-ink-50/50 dark:bg-ink-900/50 flex flex-col gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm text-ink-800 dark:text-ink-100">Payment schedule</h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">Milestones must total 100%.</p>
        </div>
        <div className="flex gap-1.5">
          <SecondaryButton onClick={handleUseTemplate} className="h-auto py-1.5 px-2.5 flex-1">
            <FileSpreadsheet size={13} /> By Phase
          </SecondaryButton>
          <SecondaryButton onClick={handleMonthlyTemplate} className="h-auto py-1.5 px-2.5 flex-1">
            <CalendarDays size={13} /> Monthly
          </SecondaryButton>
          <SecondaryButton onClick={handleCostWeightedTemplate} className="h-auto py-1.5 px-2.5 flex-1" title="One payment per phase, sized by that phase's actual cost — no mobilisation or final-payment line items.">
            <Layers size={13} /> By Cost
          </SecondaryButton>
        </div>
      </CardHeader>

      <div className="p-3 border-b border-ink-100 dark:border-ink-800">
        {projectName && (
          <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-400 rounded-md mb-2">
            {projectName}
          </span>
        )}
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
          <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Payment name, e.g. Phase 1 Completion" className={fieldClass + ' w-full'} />
          <div className="flex gap-2 items-center">
            <input type="number" required min="0" max={Math.max(0, 100 - totalPercentage)} step="0.01" value={newPercentage} onChange={e => setNewPercentage(e.target.value)} placeholder="%" className={fieldClass + ' w-24 text-center shrink-0'} />
            <select value={newPhaseId} onChange={e => setNewPhaseId(e.target.value)} className={fieldClass + ' flex-1'}>
              <option value="">(No phase)</option>
              {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <PrimaryButton type="submit"><Plus size={15} /> Add</PrimaryButton>
          </div>
        </form>
      </div>

      <CardBody className="overflow-y-auto relative">
        <div className="flex justify-between items-center px-4 py-2 border-b border-ink-100 dark:border-ink-800 bg-ink-50/50 dark:bg-ink-900/40">
          <span className="text-xs font-medium text-ink-500">Total allocated</span>
          <span className={`text-sm font-bold ${totalPercentage === 100 ? 'text-positive-600' : totalPercentage > 100 ? 'text-negative-600' : 'text-warning-500'}`}>
            {totalPercentage.toFixed(2)}%
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center text-ink-500 dark:text-ink-600 py-8 flex flex-col items-center gap-2">
            <FileSpreadsheet size={36} className="text-ink-200 dark:text-ink-700" />
            <p className="text-sm">No payments scheduled.</p>
          </div>
        ) : (
          payments.map((payment, index) => {
            const linkedPhase = phases.find(p => p.id === payment.phaseId);

            if (editingId === payment.id) {
              return (
                <div key={payment.id} className="p-3 border-b border-accent-200 dark:border-accent-900 bg-accent-50/50 dark:bg-accent-900/10">
                  <form onSubmit={handleEditSave} className="flex-1 flex flex-col gap-2">
                    <input type="text" autoFocus required value={editName} onChange={e => setEditName(e.target.value)} className={fieldClass + ' w-full'} />
                    <div className="flex gap-2 items-center justify-between">
                      <input type="number" required min="0" max={Math.max(0, 100 - (totalPercentage - payment.percentage))} step="0.01" value={editPercentage} onChange={e => setEditPercentage(e.target.value)} className={fieldClass + ' w-24 text-center shrink-0'} />
                      <select value={editPhaseId} onChange={e => setEditPhaseId(e.target.value)} className={fieldClass + ' flex-1'}>
                        <option value="">(No phase)</option>
                        {phases.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <div className="flex gap-1 shrink-0">
                        <IconButton type="button" onClick={() => setEditingId(null)}><X size={14} /></IconButton>
                        <IconButton type="submit" className="text-positive-600 dark:text-positive-400"><Check size={14} /></IconButton>
                      </div>
                    </div>
                  </form>
                </div>
              );
            }

            const amount = totalFee > 0 ? (payment.percentage / 100) * totalFee : null;

            return (
              <Row key={payment.id}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-500 w-5 shrink-0">{index + 1}.</span>
                    <span className="font-semibold text-ink-800 dark:text-ink-200 text-sm truncate">{payment.name}</span>
                  </div>
                  <div className="ml-7 flex items-center gap-2 mt-0.5">
                    {linkedPhase && (
                      <span className="text-xs font-medium text-accent-600 dark:text-accent-400">
                        {linkedPhase.name}
                      </span>
                    )}
                    {amount !== null && (
                      <span className="text-[11px] text-ink-500 dark:text-ink-400">
                        ≈ {formatCurrency ? formatCurrency(amount) : amount.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 relative">
                  <InlinePercentInput
                    value={payment.percentage}
                    maxAllowed={100 - (totalPercentage - payment.percentage)}
                    onChange={async (newVal) => {
                      if (payment.id) {
                        await updatePayment(payment.id, { percentage: newVal });
                        loadPayments();
                      }
                    }}
                  />

                  <RowMenu
                    items={[
                      { label: 'Edit Payment', icon: <Pencil size={14} />, onClick: () => handleEditStart(payment) },
                      { label: 'Add Payment Before', icon: <Plus size={14} />, onClick: () => handleAddBeforeAfter(payment, 'before') },
                      { label: 'Add Payment After', icon: <Plus size={14} />, onClick: () => handleAddBeforeAfter(payment, 'after') },
                      { label: 'Delete Payment', icon: <Trash2 size={14} />, danger: true, onClick: () => handleDelete(payment.id!) },
                    ]}
                  />
                </div>
              </Row>
            );
          })
        )}
      </CardBody>
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </Card>
  );
}
