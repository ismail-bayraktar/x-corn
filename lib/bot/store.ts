// Zustand state management

import { create } from 'zustand';
import { BotState, AccountState, BotLog } from './types';

interface BotStore extends BotState {
  // Actions
  setRunning: (isRunning: boolean) => void;
  setTweetUrl: (url: string) => void;
  updateAccountStatus: (id: string, status: Partial<AccountState>) => void;
  addLog: (log: BotLog) => void;
  setLogs: (logs: BotLog[]) => void;
  clearLogs: () => void;
  resetState: () => void;
  initAccounts: (accountIds: string[]) => void;
}

const initialState: BotState = {
  isRunning: false,
  tweetUrl: '',
  accounts: [],
  logs: [],
};

export const useBotStore = create<BotStore>((set) => ({
  ...initialState,

  setRunning: (isRunning) =>
    set((state) => ({
      isRunning,
      startedAt: isRunning ? new Date().toISOString() : state.startedAt,
      completedAt: !isRunning ? new Date().toISOString() : undefined,
    })),

  setTweetUrl: (tweetUrl) => set({ tweetUrl }),

  initAccounts: (accountIds) =>
    set({
      accounts: accountIds.map((id) => ({
        id,
        status: 'idle',
      })),
    }),

  updateAccountStatus: (id, status) =>
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === id ? { ...acc, ...status } : acc
      ),
    })),

  addLog: (log) =>
    set((state) => ({
      logs: [...state.logs, log],
    })),

  setLogs: (logs) => set({ logs }),

  clearLogs: () => set({ logs: [] }),

  resetState: () =>
    set({
      ...initialState,
      accounts: [],
    }),
}));
