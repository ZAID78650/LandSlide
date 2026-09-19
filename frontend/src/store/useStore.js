import { create } from 'zustand';

const useStore = create((set, get) => ({
  // Auth
  user: null,
  token: localStorage.getItem('nexus_token') || null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('nexus_token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('nexus_token');
    set({ user: null, token: null });
  },

  // UI State
  sidebarExpanded: false,
  rightPanelOpen: false,
  setSidebarExpanded: (v) => set({ sidebarExpanded: v }),
  setRightPanelOpen: (v) => set({ rightPanelOpen: v }),
  
  // Terminal State
  terminalOpen: false,
  setTerminalOpen: (v) => set({ terminalOpen: v }),
  terminalLogs: [],
  setTerminalLogs: (logs) => set({ terminalLogs: typeof logs === 'function' ? logs(get().terminalLogs) : logs }),
  isTerminalScanning: false,
  setIsTerminalScanning: (v) => set({ isTerminalScanning: v }),

  // Incidents
  incidents: [],
  setIncidents: (incidents) => set({ incidents }),

  // Alerts
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  activeAlertCount: 0,
  setActiveAlertCount: (n) => set({ activeAlertCount: n }),

  // Sensors (live)
  liveReadings: [],
  addLiveReading: (readings) => set({ liveReadings: readings }),

  // Summary stats
  summary: null,
  setSummary: (s) => set({ summary: s }),
}));

export default useStore;
