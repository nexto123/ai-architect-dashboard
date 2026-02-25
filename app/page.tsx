'use client';

import { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, update } from 'firebase/database';
import { 
  Activity, 
  Users, 
  Cpu, 
  DollarSign, 
  Plus, 
  Settings, 
  Play, 
  Pause, 
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  Zap,
  BarChart3,
  Search,
  Bell
} from 'lucide-react';
import { firebaseConfig } from './lib/firebase';
import GoogleWorkspaceHub from './components/GoogleWorkspaceHub';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Types
interface Client {
  id: string;
  name: string;
  industry: string;
  status: 'healthy' | 'warning' | 'error';
  agents: number;
  lastActivity: string;
  uptime: string;
  monthlyCost: number;
}

interface Agent {
  id: string;
  name: string;
  clientId: string;
  status: 'running' | 'paused' | 'error';
  type: string;
  lastRun: string;
  cpu: number;
  memory: number;
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  timestamp: string;
  clientId?: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState<Client[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', industry: '' });
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Load data from Firebase
  useEffect(() => {
    // Check for Google OAuth callback (client-side only)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('access_token');
      if (token) {
        setGoogleAccessToken(token);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    const clientsRef = ref(db, 'clients');
    const agentsRef = ref(db, 'agents');
    const alertsRef = ref(db, 'alerts');

    const unsubscribeClients = onValue(clientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const clientList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value
        }));
        setClients(clientList);
      } else {
        // Initialize with demo data
        const demoClients: Client[] = [
          {
            id: 'demo-1',
            name: 'ACME Semiconductor',
            industry: 'Semiconductor Testing',
            status: 'healthy',
            agents: 3,
            lastActivity: '2 min ago',
            uptime: '99.2%',
            monthlyCost: 47.30
          },
          {
            id: 'demo-2',
            name: 'Coastal Insurance',
            industry: 'Insurance Brokerage',
            status: 'warning',
            agents: 2,
            lastActivity: '15 min ago',
            uptime: '98.1%',
            monthlyCost: 23.50
          }
        ];
        setClients(demoClients);
        demoClients.forEach(c => set(ref(db, `clients/${c.id}`), c));
      }
      setLoading(false);
    });

    const unsubscribeAgents = onValue(agentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const agentList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value
        }));
        setAgents(agentList);
      } else {
        // Initialize with demo agents
        const demoAgents: Agent[] = [
          {
            id: 'agent-1',
            name: 'Calibration Tracker',
            clientId: 'demo-1',
            status: 'running',
            type: 'scheduler',
            lastRun: '2 min ago',
            cpu: 12,
            memory: 256
          },
          {
            id: 'agent-2',
            name: 'Alert Dispatcher',
            clientId: 'demo-1',
            status: 'running',
            type: 'notifications',
            lastRun: '5 min ago',
            cpu: 8,
            memory: 128
          },
          {
            id: 'agent-3',
            name: 'Report Generator',
            clientId: 'demo-1',
            status: 'paused',
            type: 'reports',
            lastRun: '1 hour ago',
            cpu: 0,
            memory: 64
          }
        ];
        setAgents(demoAgents);
        demoAgents.forEach(a => set(ref(db, `agents/${a.id}`), a));
      }
    });

    const unsubscribeAlerts = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const alertList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value
        }));
        setAlerts(alertList);
      } else {
        const demoAlerts: Alert[] = [
          {
            id: 'alert-1',
            severity: 'warning',
            message: 'Calibration due for 3 boards at ACME',
            timestamp: new Date().toISOString(),
            clientId: 'demo-1'
          }
        ];
        setAlerts(demoAlerts);
        demoAlerts.forEach(a => set(ref(db, `alerts/${a.id}`), a));
      }
    });

    return () => {
      unsubscribeClients();
      unsubscribeAgents();
      unsubscribeAlerts();
    };
  }, []);

  const addClient = async () => {
    if (!newClient.name || !newClient.industry) return;
    
    const clientRef = push(ref(db, 'clients'));
    const client: Client = {
      id: clientRef.key!,
      name: newClient.name,
      industry: newClient.industry,
      status: 'healthy',
      agents: 0,
      lastActivity: 'Just now',
      uptime: '100%',
      monthlyCost: 0
    };
    
    await set(clientRef, client);
    setNewClient({ name: '', industry: '' });
    setShowAddClient(false);
  };

  const toggleAgent = async (agentId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'running' ? 'paused' : 'running';
    await update(ref(db, `agents/${agentId}`), { 
      status: newStatus,
      cpu: newStatus === 'running' ? Math.floor(Math.random() * 20) + 5 : 0
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return '#00e676';
      case 'warning':
        return '#ffb300';
      case 'error':
      case 'paused':
        return '#ff5252';
      default:
        return '#00e5ff';
    }
  };

  const totalAgents = agents.length;
  const runningAgents = agents.filter(a => a.status === 'running').length;
  const totalCost = clients.reduce((sum, c) => sum + c.monthlyCost, 0);
  const activeAlerts = alerts.filter(a => a.severity !== 'info').length;

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ color: 'var(--accent-cyan)', fontSize: '1.2rem' }}>
          Initializing Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(10, 10, 15, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40,
            height: 40,
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-cyan-dim))',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap size={20} color="#0a0a0f" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>AI Architect</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', letterSpacing: 2 }}>COMMAND CENTER</div>
          </div>
        </div>

        <nav style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'var(--glass-bg)',
          padding: '0.375rem',
          borderRadius: 12,
          border: '1px solid var(--glass-border)'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'clients', label: 'Clients', icon: Users },
            { id: 'agents', label: 'Agents', icon: Cpu },
            { id: 'google', label: 'Google Workspace', icon: Server },
            { id: 'deploy', label: 'Deploy', icon: Server }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: 8,
                border: 'none',
                background: activeTab === tab.id ? 'var(--accent-cyan-dim)' : 'transparent',
                color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'all 0.3s'
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search..."
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 8,
                padding: '0.5rem 1rem 0.5rem 2.5rem',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                width: 200
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 8,
              height: 8,
              background: 'var(--accent-green)',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Connected</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: 1600, margin: '0 auto' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
                background: 'linear-gradient(135deg, var(--text-primary), var(--accent-cyan))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                System Online. Welcome back, Architect.
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Managing {clients.length} clients with {totalAgents} deployed agents
              </p>
            </div>

            {/* Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              <MetricCard
                title="Active Clients"
                value={clients.length.toString()}
                trend={`${clients.filter(c => c.status === 'healthy').length} healthy`}
                icon={Users}
                color="cyan"
              />
              <MetricCard
                title="Running Agents"
                value={`${runningAgents}/${totalAgents}`}
                trend={totalAgents > 0 ? `${Math.round(runningAgents/totalAgents*100)}% active` : 'No agents'}
                icon={Cpu}
                color="green"
              />
              <MetricCard
                title="Monthly Cost"
                value={`$${totalCost.toFixed(2)}`}
                trend="API + Infrastructure"
                icon={DollarSign}
                color="amber"
              />
              <MetricCard
                title="Active Alerts"
                value={activeAlerts.toString()}
                trend={activeAlerts > 0 ? 'Needs attention' : 'All clear'}
                icon={AlertCircle}
                color={activeAlerts > 0 ? 'red' : 'green'}
              />
            </div>

            {/* Recent Alerts */}
            <div style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 16,
              padding: '1.5rem'
            }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                Recent Alerts
              </h3>
              {alerts.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No alerts</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {alerts.map(alert => (
                    <div key={alert.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 8,
                      borderLeft: `3px solid ${getStatusColor(alert.severity)}`
                    }}>
                      <AlertCircle size={16} color={getStatusColor(alert.severity)} />
                      <span style={{ flex: 1 }}>{alert.message}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Client Deployments</h1>
              <button
                onClick={() => setShowAddClient(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--accent-cyan)',
                  color: '#0a0a0f',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Plus size={18} />
                Add Client
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '1.5rem'
            }}>
              {clients.map(client => (
                <div key={client.id} style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 16,
                  padding: '1.5rem',
                  transition: 'all 0.3s',
                  cursor: 'pointer'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{client.name}</h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{client.industry}</p>
                    </div>
                    <div style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: getStatusColor(client.status),
                      boxShadow: `0 0 10px ${getStatusColor(client.status)}`
                    }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Agents</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{client.agents}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Uptime</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>{client.uptime}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Cost</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 600 }}>${client.monthlyCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last Activity</p>
                      <p style={{ fontSize: '1rem' }}>{client.lastActivity}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 6,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}>
                      View Details
                    </button>
                    <button style={{
                      padding: '0.5rem',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 6,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}>
                      <Settings size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '2rem' }}>Agent Swarm</h1>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem'
            }}>
              {agents.map(agent => (
                <div key={agent.id} style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 16,
                  padding: '1.5rem',
                  opacity: agent.status === 'paused' ? 0.6 : 1
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, var(--accent-cyan-dim), var(--accent-cyan))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Cpu size={24} color="#0a0a0f" />
                      </div>
                      <div>
                        <h3 style={{ fontWeight: 600 }}>{agent.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{agent.type}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: getStatusColor(agent.status),
                        animation: agent.status === 'running' ? 'pulse 1.5s infinite' : 'none'
                      }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        {agent.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CPU</p>
                      <p style={{ fontSize: '1.1rem' }}>{agent.cpu}%</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Memory</p>
                      <p style={{ fontSize: '1.1rem' }}>{agent.memory}MB</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last run: {agent.lastRun}</span>
                    <button
                      onClick={() => toggleAgent(agent.id, agent.status)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: agent.status === 'running' ? 'var(--accent-red)' : 'var(--accent-green)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {agent.status === 'running' ? <Pause size={14} /> : <Play size={14} />}
                      {agent.status === 'running' ? 'Pause' : 'Start'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Google Workspace Tab */}
        {activeTab === 'google' && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '2rem' }}>Google Workspace</h1>
            <GoogleWorkspaceHub 
              accessToken={googleAccessToken} 
              onAuth={() => setGoogleAccessToken(null)} 
            />
          </div>
        )}

        {/* Deploy Tab */}
        {activeTab === 'deploy' && (
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '2rem' }}>Deploy New Agent</h1>

            <div style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(16px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 16,
              padding: '2rem',
              maxWidth: 600
            }}>
              <h3 style={{ marginBottom: '1.5rem' }}>Quick Deploy</h3>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Select Client
                </label>
                <select style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)'
                }}>
                  <option value="">Choose a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Agent Type
                </label>
                <select style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)'
                }}>
                  <option value="">Select agent type...</option>
                  <option value="calibration">Calibration Tracker</option>
                  <option value="alerts">Alert Dispatcher</option>
                  <option value="reports">Report Generator</option>
                  <option value="scheduler">Task Scheduler</option>
                  <option value="parser">Data Parser</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Agent Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., ACME Calibration Bot"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <button style={{
                width: '100%',
                padding: '1rem',
                background: 'var(--accent-cyan)',
                color: '#0a0a0f',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer'
              }}>
                Deploy Agent
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Add Client Modal */}
      {showAddClient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 16,
            padding: '2rem',
            width: '90%',
            maxWidth: 500
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Add New Client</h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Company Name
              </label>
              <input
                type="text"
                value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Industry
              </label>
              <select
                value={newClient.industry}
                onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  color: 'var(--text-primary)'
                }}
              >
                <option value="">Select industry...</option>
                <option value="Semiconductor">Semiconductor</option>
                <option value="Insurance">Insurance</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowAddClient(false)}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 8,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addClient}
                style={{
                  flex: 1,
                  padding: '0.875rem',
                  background: 'var(--accent-cyan)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#0a0a0f',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, trend, icon: Icon, color }: any) {
  const colors: any = {
    cyan: { bg: 'rgba(0, 229, 255, 0.2)', icon: '#00e5ff' },
    green: { bg: 'rgba(0, 230, 118, 0.2)', icon: '#00e676' },
    amber: { bg: 'rgba(255, 179, 0, 0.2)', icon: '#ffb300' },
    red: { bg: 'rgba(255, 82, 82, 0.2)', icon: '#ff5252' }
  };

  return (
    <div style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--glass-border)',
      borderRadius: 16,
      padding: '1.5rem',
      transition: 'all 0.3s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>
          {title}
        </span>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: colors[color].bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={20} color={colors[color].icon} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{trend}</div>
    </div>
  );
}