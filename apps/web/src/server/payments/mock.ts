import 'server-only';
import { env } from '../env';
import type { PaymentGateway } from './gateway';

/**
 * Mock gateway: redirects to an on-site simulated payment page (/[locale]/pay/mock) that mimics the
 * provider's hosted page. The outcome the shopper picks is posted back and verified here.
 */
export function mockGateway(id: 'bkash' | 'nagad' | 'card'): PaymentGateway {
  return {
    id: `mock-${id}`,
    async initiate(input) {
      const url = `${env.appUrl}/${input.locale}/pay/mock?session=${encodeURIComponent(input.sessionId)}`;
      return { redirectUrl: url, providerRef: `MOCK-${id.toUpperCase()}-${input.sessionId.slice(0, 8)}` };
    },
    async verify(_sessionId, payload) {
      const outcome = String(payload.outcome ?? '');
      if (outcome === 'success') return { status: 'success', providerRef: `MOCKTX${Date.now().toString(36).toUpperCase()}`, raw: payload };
      if (outcome === 'cancel') return { status: 'cancelled', raw: payload };
      return { status: 'failed', raw: payload };
    },
  };
}
