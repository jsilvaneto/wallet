import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import api from '../../lib/api';

interface Category {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE';
    parent_id?: string | null;
    created_at: string;
    sub_categories?: Category[];
}

const fetchCategories = async (): Promise<Category[]> => {
    const { data } = await api.get('/categories');
    return data;
};

const CategoriesList: React.FC = () => {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
    const [parentId, setParentId] = useState<string>('');

    const { data: categories, isLoading, error } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategories,
    });

    const createMutation = useMutation({
        mutationFn: async (newCategory: { name: string; type: string; parent_id?: string }) => {
            return await api.post('/categories', newCategory);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            closeForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (updatedCategory: { id: string; name: string; type: string; parent_id?: string }) => {
            return await api.patch(`/categories/${updatedCategory.id}`, updatedCategory);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            closeForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    const closeForm = () => {
        setIsCreating(false);
        setEditingCategoryId(null);
        setName('');
        setType('EXPENSE');
        setParentId('');
    };

    const openCreate = () => {
        closeForm();
        setIsCreating(true);
    };

    const openEdit = (cat: Category) => {
        closeForm();
        setEditingCategoryId(cat.id);
        setName(cat.name);
        setType(cat.type);
        setParentId(cat.parent_id || '');
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = { name, type, parent_id: parentId || undefined };

        if (editingCategoryId) {
            updateMutation.mutate({ id: editingCategoryId, ...payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const getIconForType = (type: string) => {
        if (type === 'INCOME') return <ArrowUpCircle size={20} color="var(--income)" />;
        return <ArrowDownCircle size={20} color="var(--expense)" />;
    };

    if (isLoading) return <div className="animate-fade-in" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Carregando categorias...</div>;
    if (error) return <div className="animate-fade-in" style={{ padding: '2rem', color: 'var(--expense)' }}>Erro ao carregar categorias.</div>;

    const showForm = isCreating || editingCategoryId !== null;
    const isSaving = createMutation.isPending || updateMutation.isPending;

    const parentOptions = categories?.filter(c => c.type === type && c.id !== editingCategoryId) || [];

    return (
        <div className="flex flex-col gap-6">
            <header className="flex justify-between items-center" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem' }}>Gerenciar Categorias</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Classifique suas receitas e despesas com subcategorias.</p>
                </div>
                {!showForm && (
                    <button type="button" className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={18} /> Nova Categoria
                    </button>
                )}
            </header>

            {showForm && (
                <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', border: `1px solid ${editingCategoryId ? 'var(--income)' : 'var(--primary)'} ` }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem' }}>{editingCategoryId ? 'Editar Categoria' : 'Cadastrar Nova Categoria'}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Nome da Categoria</label>
                            <input type="text" className="input" placeholder="Ex: Alimentação" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Natureza</label>
                            <select className="input" value={type} onChange={(e) => { setType(e.target.value as any); setParentId(''); }} required style={{ appearance: 'none' }}>
                                <option value="EXPENSE">Despesa (Passivo)</option>
                                <option value="INCOME">Receita (Ativo)</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Subcategoria de (Opcional)</label>
                            <select className="input" value={parentId} onChange={(e) => setParentId(e.target.value)} style={{ appearance: 'none' }}>
                                <option value="">Nenhuma (Categoria Principal)</option>
                                {parentOptions.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn" style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)' }} onClick={closeForm}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-primary" disabled={isSaving} onClick={handleFormSubmit}>
                            {isSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {categories?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        Nenhuma categoria cadastrada.
                    </div>
                ) : (
                    categories?.map((cat) => (
                        <div key={cat.id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div className="flex justify-between items-center" style={{ padding: '1rem', background: 'hsla(0,0%,100%,0.02)' }}>
                                <div className="flex items-center gap-4">
                                    <div style={{ padding: '0.5rem', background: 'hsla(0,0%,100%,0.05)', borderRadius: '8px' }}>
                                        {getIconForType(cat.type)}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 500 }}>{cat.name}</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{cat.type === 'INCOME' ? 'Receita' : 'Despesa'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.preventDefault(); openEdit(cat); }} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} title="Editar Categoria">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={(e) => { e.preventDefault(); if (window.confirm('Desativar categoria e subcategorias?')) deleteMutation.mutate(cat.id); }} style={{ background: 'transparent', border: '1px solid hsla(350, 75%, 65%, 0.3)', color: 'var(--expense)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} title="Desativar Categoria">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {cat.sub_categories && cat.sub_categories.length > 0 && (
                                <div style={{ padding: '0 1rem 1rem 3rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {cat.sub_categories.map(sub => (
                                        <div key={sub.id} className="flex justify-between items-center" style={{ padding: '0.75rem', background: 'hsla(0,0%,100%,0.01)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                                            <div className="flex items-center gap-3">
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border)' }}></div>
                                                <span style={{ fontSize: '0.9rem' }}>{sub.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { e.preventDefault(); openEdit(sub); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Editar Subcategoria">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={(e) => { e.preventDefault(); if (window.confirm('Desativar subcategoria?')) deleteMutation.mutate(sub.id); }} style={{ background: 'transparent', border: 'none', color: 'var(--expense)', cursor: 'pointer', opacity: 0.7 }} title="Desativar">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CategoriesList;
