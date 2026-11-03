import 'server-only';
import { env } from '../env';
import type { PaymentGateway } from './gateway';
import { mockGateway } from './mock';
import { sslcommerzGateway } from './sslcommerz';

/**
 * Gateway registry. In `mock` mode (default) every method uses the simulated gateway.
 * In sandbox/live: card → SSLCommerz when credentials exist. bKash/Nagad direct APIs need merchant
 * onboarding; until credentials are provided they are routed through the mock adapter (or SSLCommerz,
 * which also accepts bKash/Nagad wallets on its hosted page).
 */
export function gatewayFor(method: 'bkash' | 'nagad' | 'card'): PaymentGateway {
  if (env.paymentMode !== 'mock' && process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD) return sslcommerzGateway();
  return mockGateway(method);
}
export type { PaymentGateway } from './gateway';
