import 'server-only';

export interface InitiateInput {
  sessionId: string;
  orderNo: string;
  amount: number;
  method: 'bkash' | 'nagad' | 'card';
  customer: { name: string; phone: string; email?: string | null };
  locale: 'en' | 'bn';
}
export interface InitiateResult { redirectUrl: string; providerRef?: string }
export interface VerifyResult { status: 'success' | 'failed' | 'cancelled'; providerRef?: string; raw?: unknown }

/** Every gateway (bKash, Nagad, SSLCommerz) implements this; checkout/order code never talks to a provider directly. */
export interface PaymentGateway {
  readonly id: string;
  initiate(input: InitiateInput): Promise<InitiateResult>;
  verify(sessionId: string, payload: Record<string, unknown>): Promise<VerifyResult>;
}
