import { supabase } from './supabase';

export const signInWithMFA = async (email: string, password: string) => {
  // 1. Login inicial
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // 2. Verificar si requiere MFA
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) throw factorsError;

  const totpFactor = factors.totp.find((f: { status: string; }) => f.status === 'verified');
  return { session: data.session, requiresMFA: !!totpFactor, factorId: totpFactor?.id };
};

export const verifyMFA = async (factorId: string, code: string) => {
  const { data, error } = await supabase.auth.mfa.verify({
      factorId, code,
      challengeId: ''
  });
  if (error) throw error;
  return data;
};