import { supabase } from './supabase';

const BASE_URL = 'https://investment-intellegince.vercel.app';

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const authHeaders = await getAuthHeader();
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const mergedHeaders: Record<string, string> = {
    ...authHeaders,
  };
  
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        mergedHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        mergedHeaders[key] = value;
      });
    } else {
      Object.assign(mergedHeaders, options.headers);
    }
  }
  
  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Concrete data helpers for dashboard & modules
export async function getDashboardNetWorth() {
  return apiFetch('/api/dashboard/net-worth');
}

export async function getDashboardLastLogin() {
  return apiFetch('/api/dashboard/last-login');
}

export async function getUserProfile() {
  return apiFetch('/api/profile');
}

export async function getBankingAccounts() {
  return apiFetch('/api/banking/accounts');
}

export async function getAssets() {
  return apiFetch('/api/assets');
}

export async function getLiabilities() {
  return apiFetch('/api/liabilities');
}

export async function getReceivables() {
  return apiFetch('/api/receivables');
}
