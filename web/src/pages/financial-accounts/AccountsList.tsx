import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, Plus, Trash2, Building, CreditCard, Banknote, Edit2 } from 'lucide-react';
import api from '../../lib/api';

interface FinancialAccount {
    id: string;
    name: string;
    type: 'CASH' | 'BANK' | 'CREDIT_CARD';
    initial_balance: number;
    created_at: string;
}

const fetchAccounts = async (): Promise<FinancialAccount[]> => {
    const { data } = await api.get('/financial-accounts');
    return data;
};

const AccountsList: React.FC = () => {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<'CASH' | 'BANK' | 'CREDIT_CARD'>('BANK');
    const [initialBalance, setInitialBalance] = useState('');

    const { data: accounts, isLoading, error } = useQuery({
        queryKey: ['financialAccounts'],
        queryFn: fetchAccounts,
    });

    const createMutation = useMutation({
        mutationFn: async (newAccount: { name: string; type: string; initial_balance: number }) => {
            return await api.post('/financial-accounts', newAccount);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financialAccounts'] });
            closeForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (updatedAccount: { id: string; name: string; type: string; initial_balance: number }) => {
            return await api.patch(`/financial-accounts/${updatedAccount.id}`, updatedAccount);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financialAccounts'] });
            closeForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/financial-accounts/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['financialAccounts'] });
        },
    });

    const closeForm = () => {
        setIsCreating(false);
        setEditingAccountId(null);
        setName('');
        setType('BANK');
        setInitialBalance('');
    };

    const openCreate = () => {
        closeForm();
        setIsCreating(true);
    };

    const openEdit = (acc: FinancialAccount) => {
        closeForm();
        setEditingAccountId(acc.id);
        setName(acc.name);
        setType(acc.type);
        setInitialBalance(acc.initial_balance.toString());
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            name,
            type,
            initial_balance: Number(initialBalance) || 0,
        };

        if (editingAccountId) {
            updateMutation.mutate({ id: editingAccountId, ...payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const formatCurrency = (val: number | string) => {
        const numericVal = Number(val) || 0;
        return `$ ${numericVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'CASH': return <Banknote size={20} color="var(--income)" />;
            case 'CREDIT_CARD': return <CreditCard size={20} color="var(--expense)" />;
            default: return <Building size={20} color="var(--primary)" />;
        }
    };

    if (isLoading) return <div className="animate-fade-in" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Carregando contas...</div>;
    if (error) return <div className="animate-fade-in" style={{ padding: '2rem', color: 'var(--expense)' }}>Erro ao carregar contas financeiras.</div>;

    const showForm = isCreating || editingAccountId !== null;
    const isSaving = createMutation.isPending || updateMutation.isPending;

    return (
        <div className="animate-fade-in flex flex-col gap-6">
            <header className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', background: 'hsla(0,0%,100%,0.05)', borderRadius: 'var(--radius-md)' }}>
                        <Wallet size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem' }}>Contas Financeiras</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Gerencie suas carteiras, bancos e cartões.</p>
                    </div>
                </div>
                {!showForm && (
                    <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Nova Conta
                    </button>
                )}
            </header>

            {showForm && (
                <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', border: `1px solid ${editingAccountId ? 'var(--income)' : 'var(--primary)'}` }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>{editingAccountId ? 'Editar Conta' : 'Cadastrar Nova Conta'}</h3>
                    <form onSubmit={handleFormSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Nome da Conta</label>
                            <input type="text" className="input" placeholder="Ex: NuBank" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tipo</label>
                            <select className="input" value={type} onChange={(e) => setType(e.target.value as any)} required style={{ appearance: 'none' }}>
                                <option value="BANK">Conta Corrente</option>
                                <option value="CREDIT_CARD">Cartão de Crédito</option>
                                <option value="CASH">Dinheiro Físico</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Saldo Inicial</label>
                            <input type="number" step="0.01" className="input" placeholder="0.00" value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} required />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }} onClick={closeForm}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {accounts?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        Nenhuma conta financeira cadastrada. Clique em "Nova Conta" para começar.
                    </div>
                ) : (
                    accounts?.map((acc) => (
                        <div key={acc.id} className="flex justify-between items-center" style={{ padding: '1.25rem', background: 'hsla(0,0%,100%,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                            <div className="flex items-center gap-4">
                                <div style={{ padding: '0.75rem', background: 'hsla(0,0%,100%,0.05)', borderRadius: '10px' }}>
                                    {getIconForType(acc.type)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 500 }}>{acc.name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{acc.type === 'BANK' ? 'Banco' : acc.type === 'CASH' ? 'Carteira' : 'Cartão'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Saldo Inicial</p>
                                    <span style={{ fontSize: '1.125rem', fontWeight: 600 }}>{formatCurrency(acc.initial_balance)}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => openEdit(acc)}
                                        style={{ background: 'hsla(0,0%,100%,0.05)', border: 'none', color: 'var(--text-primary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
                                        title="Editar Conta"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => { if (window.confirm('Tem certeza que deseja desativar esta conta? Ela não aparecerá mais nas novas transações.')) deleteMutation.mutate(acc.id) }}
                                        style={{ background: 'hsla(350, 75%, 65%, 0.1)', border: 'none', color: 'var(--expense)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.2s' }}
                                        title="Desativar Conta"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AccountsList;
