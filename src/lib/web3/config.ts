import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { http } from 'viem';
import { getBaseRpcUrl } from '@/lib/constants/rpc';

// Configurazione delle chain supportate - solo BASE
export const chains = [base] as const;

// Get RPC URL (ALWAYS Alchemy - required)
const baseRpcUrl = getBaseRpcUrl();

// Configurazione di Wagmi e RainbowKit
export const config = getDefaultConfig({
  appName: 'Wave - Liquidity as a Service',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains,
  ssr: false, // Non usiamo SSR con Vite
  transports: {
    [base.id]: http(baseRpcUrl, {
      batch: true,
      // Configurazione ottimizzata per Alchemy
      timeout: 30_000, // 30 secondi
      retryCount: 3, // Riprova fino a 3 volte
      retryDelay: 1000, // Attendi 1 secondo tra i retry
    }),
  },
});

