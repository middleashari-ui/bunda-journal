// Verifikasi hak ekspor ke server (bukan hanya localStorage yang bisa diedit).
// Fail-open kalau server tidak terjangkau, supaya user offline tidak terkunci.
import { getToken } from './authClient';
import { ESSENTIAL_GATE_ENABLED } from './bookPages';

export interface EntitlementCheck {
  allowed: boolean;
  tier?: 'essential' | 'vip' | 'none';
  reason?: 'vip-required' | 'offline' | 'gate-off';
}

export async function verifyExportEntitlement(): Promise<EntitlementCheck> {
  if (!ESSENTIAL_GATE_ENABLED) return { allowed: true, reason: 'gate-off' };

  const token = getToken();
  if (!token) return { allowed: true, reason: 'offline' };

  try {
    const res = await fetch(`/api/entitlement?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
    if (!res.ok) return { allowed: true, reason: 'offline' };
    const data = await res.json();
    const tier = data?.tier as EntitlementCheck['tier'];
    return {
      allowed: data?.canExport === true,
      tier,
      reason: data?.canExport === true ? undefined : 'vip-required',
    };
  } catch {
    return { allowed: true, reason: 'offline' };
  }
}
