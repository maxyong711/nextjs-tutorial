import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  process.env.API_URL ||
  'http://localhost:8000/api'
).replace(/\/+$/, '');

function apiUrl(path: string) {
  const cleanedPath = path.replace(/^\/+/, '');
  return `${API_BASE_URL}/${cleanedPath}`;
}

async function fetchJson<T>(url: string) {
  const res = await fetch(url, {
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[api] request failed ${res.status} ${res.statusText} -> ${url}`, body);
    throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function fetchRevenue() {
  try {
    const data = await fetchJson<Revenue[]>(apiUrl('/revenue/'));
    return data;
  } catch (error) {
    console.error('fetchRevenue Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  try {
    const data = await fetchJson<LatestInvoiceRaw[] | { results?: LatestInvoiceRaw[] }>(
      apiUrl('/invoices/?limit=5'),
    );

    const latestInvoicesRaw = Array.isArray(data) ? data : data.results ?? [];

    return latestInvoicesRaw.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
  } catch (error) {
    console.error('fetchLatestInvoices Error:', error);
    throw new Error('Failed to fetch latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    const [invoiceCount, customerCount, status] = await Promise.all([
      fetchJson<{ count: number }>(apiUrl('/invoices/count/')),
      fetchJson<{ count: number }>(apiUrl('/customers/count/')),
      fetchJson<{ paid: number; pending: number }>(apiUrl('/invoices/status/')),
    ]);

    return {
      numberOfCustomers: customerCount.count,
      numberOfInvoices: invoiceCount.count,
      totalPaidInvoices: formatCurrency(status.paid),
      totalPendingInvoices: formatCurrency(status.pending),
    };
  } catch (error) {
    console.error('fetchCardData Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;

function parsePaginated<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && 'results' in payload) {
    return (payload as { results?: T[] }).results ?? [];
  }
  return [];
}

export async function fetchFilteredInvoices(query: string, currentPage: number) {
  try {
    const url = new URL(apiUrl('/invoices/'));
    if (query) url.searchParams.set('search', query);
    url.searchParams.set('page', String(currentPage));
    url.searchParams.set('page_size', String(ITEMS_PER_PAGE));

    const response = await fetchJson<{ count?: number; results?: InvoicesTable[] } | InvoicesTable[]>(url.toString());
    const invoices = parsePaginated<InvoicesTable>(response);
    return invoices;
  } catch (error) {
    console.error('fetchFilteredInvoices Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const url = new URL(apiUrl('/invoices/'));
    if (query) url.searchParams.set('search', query);
    url.searchParams.set('page', '1');
    url.searchParams.set('page_size', String(ITEMS_PER_PAGE));

    const response = await fetchJson<{ count?: number; results?: InvoicesTable[] } | InvoicesTable[]>(url.toString());
    const count =
      typeof response === 'object' && response !== null && 'count' in response
        ? (response as { count?: number }).count ?? 0
        : Array.isArray(response)
        ? response.length
        : 0;

    return Math.ceil(count / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('fetchInvoicesPages Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = await fetchJson<InvoiceForm>(apiUrl(`/invoices/${id}/`));
    return {
      ...data,
      amount: data.amount / 100,
    };
  } catch (error) {
    console.error('fetchInvoiceById Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const response = await fetchJson<CustomerField[] | { results?: CustomerField[] }>(apiUrl('/customers/'));
    return Array.isArray(response) ? response : response.results ?? [];
  } catch (error) {
    console.error('fetchCustomers Error:', error);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  try {
    const url = new URL(apiUrl('/customers/'));
    if (query) url.searchParams.set('search', query);

    const response = await fetchJson<CustomersTableType[] | { results?: CustomersTableType[] }>(url.toString());
    const list = Array.isArray(response) ? response : response.results ?? [];

    return list.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));
  } catch (error) {
    console.error('fetchFilteredCustomers Error:', error);
    throw new Error('Failed to fetch customer table.');
  }
}
