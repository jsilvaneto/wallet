import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import api from '../lib/api';

const fetchDashboardData = async () => {
    const { data } = await api.get('/dashboard');
    return data;
};

const Dashboard: React.FC = () => {
    const { data: metrics, isLoading, error } = useQuery({
        queryKey: ['dashboardMetrics'],
        queryFn: fetchDashboardData,
    });

    if (isLoading) {
        return <div className="animate-fade-in" style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Carregando dados financeiros...</div>;
    }

    if (error) {
        return <div className="animate-fade-in" style={{ padding: '2rem', color: 'var(--expense)' }}>Falha ao conectar com o serviço financeiro. Tente novamente.</div>;
    }

    // Safely mapping backend payload
    const totalBalance = metrics?.consolidatedBalance || 0;
    const toReceive = metrics?.currentMonth?.totalToReceive || 0;
    const toPay = metrics?.currentMonth?.totalToPay || 0;
    const proj3 = metrics?.projections?.months3 || 0;
    const proj6 = metrics?.projections?.months6 || 0;
    const proj12 = metrics?.projections?.months12 || 0;
    const accountsInfo = metrics?.accountsBalance || [];

    const formatCurrency = (val: number | undefined | null) => {
        const numericVal = Number(val) || 0;
        return `$ ${numericVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    };

    return (
        <div className="animate-fade-in flex flex-col gap-6">
            <header className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Resumo Geral</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Acompanhe sua saúde financeira consolidada.</p>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Saldo Consolidado</p>
                        <div style={{ padding: '0.5rem', background: 'hsla(0,0%,100%,0.05)', borderRadius: 'var(--radius-md)' }}>
                            <Activity size={18} color="var(--primary)" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '2rem' }}>{formatCurrency(totalBalance)}</h2>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>A Receber (Ativos)</p>
                        <div style={{ padding: '0.5rem', background: 'hsla(145, 65%, 50%, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <ArrowUpRight size={18} color="var(--income)" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '2rem', color: 'var(--income)' }}>{formatCurrency(toReceive)}</h2>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>A Pagar (Passivos)</p>
                        <div style={{ padding: '0.5rem', background: 'hsla(350, 75%, 65%, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <ArrowDownRight size={18} color="var(--expense)" />
                        </div>
                    </div>
                    <h2 style={{ fontSize: '2rem', color: 'var(--expense)' }}>{formatCurrency(toPay)}</h2>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', minHeight: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Projeção de Fluxo de Caixa</h3>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <div style={{ flex: 1, padding: '1.5rem', background: 'hsla(0,0%,100%,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Prazo 3 Meses</p>
                            <h4 style={{ fontSize: '1.5rem' }}>{formatCurrency(proj3)}</h4>
                        </div>
                        <div style={{ flex: 1, padding: '1.5rem', background: 'hsla(0,0%,100%,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Prazo 6 Meses</p>
                            <h4 style={{ fontSize: '1.5rem' }}>{formatCurrency(proj6)}</h4>
                        </div>
                        <div style={{ flex: 1, padding: '1.5rem', background: 'hsla(0,0%,100%,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Prazo 12 Meses</p>
                            <h4 style={{ fontSize: '1.5rem' }}>{formatCurrency(proj12)}</h4>
                        </div>
                    </div>
                    <div className="flex justify-center items-center" style={{ height: '200px', color: 'var(--text-muted)', marginTop: '2rem' }}>
                        [Integração do Gráfico Visivelmente Animado]
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', minHeight: '400px' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Composição de Saldos</h3>
                    <div className="flex flex-col gap-3">
                        {accountsInfo.length > 0 ? (
                            accountsInfo.map((acc: any) => (
                                <div key={acc.id} className="flex justify-between items-center" style={{ padding: '1rem', background: 'hsla(0,0%,100%,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid hsla(0,0%,100%,0.05)' }}>
                                    <div>
                                        <p style={{ fontWeight: 500 }}>{acc.name}</p>
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(acc.balance)}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                Nenhuma conta financeira encontrada.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
