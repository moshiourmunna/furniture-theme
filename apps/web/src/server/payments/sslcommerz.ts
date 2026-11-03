import 'server-only';
import { env } from '../env';
import type { PaymentGateway } from './gateway';

/**
 * SSLCommerz hosted checkout (sandbox/live). Used when PAYMENT_MODE=sandbox|live and store credentials are set.
 * Docs: https://developer.sslcommerz.com/doc/v4/  — init → GatewayPageURL redirect → IPN/validation API.
 */
export function sslcommerzGateway(): PaymentGateway {
  const storeId = process.env.SSLCOMMERZ_STORE_ID!;
  const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD!;
  const base = env.paymentMode === 'live' ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';
  return {
    id: 'sslcommerz',
    async initiate(input) {
      const cb = `${env.appUrl}/api/v1/payments/sslcommerz/callback?session=${encodeURIComponent(input.sessionId)}`;
      const body = new URLSearchParams({
        store_id: storeId, store_passwd: storePass, total_amount: String(input.amount), currency: 'BDT', tran_id: input.sessionId,
        success_url: cb, fail_url: cb, cancel_url: cb, ipn_url: cb,
        cus_name: input.customer.name, cus_phone: input.customer.phone, cus_email: input.customer.email || 'noreply@shekor.com.bd',
        cus_add1: 'Bangladesh', cus_city: 'Dhaka', cus_country: 'Bangladesh', shipping_method: 'NO', product_name: `Order ${input.orderNo}`,
        product_category: 'Furniture', product_profile: 'physical-goods',
      });
      const res = await fetch(`${base}/gwprocess/v4/api.php`, { method: 'POST', body });
      const data = (await res.json()) as { status: string; GatewayPageURL?: string; sessionkey?: string; failedreason?: string };
      if (data.status !== 'SUCCESS' || !data.GatewayPageURL) throw new Error(`SSLCommerz init failed: ${data.failedreason ?? data.status}`);
      return { redirectUrl: data.GatewayPageURL, providerRef: data.sessionkey };
    },
    async verify(_sessionId, payload) {
      const valId = String(payload.val_id ?? '');
      if (!valId) return { status: payload.status === 'CANCELLED' ? 'cancelled' : 'failed', raw: payload };
      const url = `${base}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${storeId}&store_passwd=${storePass}&format=json`;
      const data = (await (await fetch(url)).json()) as { status: string; bank_tran_id?: string };
      return { status: data.status === 'VALID' || data.status === 'VALIDATED' ? 'success' : 'failed', providerRef: data.bank_tran_id, raw: data };
    },
  };
}
