import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Palette, Save, Tags } from 'lucide-react';
import CategoriesList from '../categories/CategoriesList';

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'notifications' | 'security' | 'categories'>('profile');
    const [isSaving, setIsSaving] = useState(false);

    // Profile State
    const [name, setName] = useState('Administrator');
    const [email, setEmail] = useState('admin@wallet.com');

    // Appearance State
    const [theme, setTheme] = useState('dark');
    const [currency, setCurrency] = useState('BRL');

    // Security State
    const [sessionTimeout, setSessionTimeout] = useState('30');

    // Load custom settings if any (Simulated for frontend-only state currently)
    useEffect(() => {
        const savedTimeout = localStorage.getItem('wallet_session_timeout');
        if (savedTimeout) setSessionTimeout(savedTimeout);
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate save
        setTimeout(() => {
            if (activeTab === 'security') {
                localStorage.setItem('wallet_session_timeout', sessionTimeout);
            }
            setIsSaving(false);
            alert('Configurações salvas com sucesso!');
        }, 800);
    };

    const tabs = [
        { id: 'profile', label: 'Meu Perfil', icon: User },
        { id: 'appearance', label: 'Aparência e Região', icon: Palette },
        { id: 'categories', label: 'Categorias e Tags', icon: Tags },
        { id: 'security', label: 'Segurança e Sessão', icon: Shield },
        { id: 'notifications', label: 'Notificações', icon: Bell },
    ] as const;

    return (
        <div className="animate-fade-in flex flex-col gap-6" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Configurações</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Gerencie suas preferências de uso e configurações de conta.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Sidebar Settings Tabs */}
                <div className="glass-card" style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    background: isActive ? 'hsla(0,0%,100%,0.08)' : 'transparent',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md)',
                                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                    fontWeight: isActive ? 600 : 400,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s',
                                }}
                                className={isActive ? '' : 'hover-bg-surface'}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="glass-card" style={{ padding: '2rem', minHeight: '400px' }}>
                    <form onSubmit={handleSave} className="flex flex-col gap-6">
                        {activeTab === 'profile' && (
                            <div className="animate-fade-in flex flex-col gap-4">
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Informações Pessoais</h2>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Nome Completo</label>
                                        <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>E-mail</label>
                                        <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="animate-fade-in flex flex-col gap-4">
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Preferências Visuais e Regionais</h2>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tema do Sistema</label>
                                        <select className="input" value={theme} onChange={(e) => setTheme(e.target.value)} style={{ appearance: 'none' }}>
                                            <option value="dark">Escuro (Dark Mode)</option>
                                            <option value="light">Claro (Light Mode)</option>
                                            <option value="system">Seguir o Sistema</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Moeda Padrão</label>
                                        <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ appearance: 'none' }}>
                                            <option value="BRL">Real Brasileiro (R$)</option>
                                            <option value="USD">Dólar Americano ($)</option>
                                            <option value="EUR">Euro (€)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="animate-fade-in flex flex-col gap-4">
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Segurança e Controle de Acesso</h2>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                                    <div style={{ maxWidth: '400px' }}>
                                        <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tempo de Inatividade (Timeout da Sessão)</label>
                                        <select className="input" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} style={{ appearance: 'none' }}>
                                            <option value="15">15 Minutos</option>
                                            <option value="30">30 Minutos</option>
                                            <option value="60">1 Hora</option>
                                            <option value="1440">1 Dia (Manter Conectado)</option>
                                        </select>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                            O sistema exigirá um novo login automaticamente se você ficar ausente por este período.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="animate-fade-in flex flex-col gap-4">
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Gerenciar Alertas</h2>
                                <p style={{ color: 'var(--text-muted)' }}>Em breve: Configurações de e-mail e notificações push para contas a vencer.</p>
                            </div>
                        )}

                        {activeTab === 'categories' && (
                            <div className="animate-fade-in">
                                <CategoriesList />
                            </div>
                        )}

                        {activeTab !== 'categories' && (
                            <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}>
                                    <Save size={18} />
                                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <style>{`.hover-bg-surface:hover { background: hsla(0,0%,100%,0.03) !important; color: var(--text-primary) !important; }`}</style>
        </div>
    );
};

export default Settings;
