import { fetchFilteredCustomers } from '@/app/lib/data';
import { lusitana } from '@/app/ui/fonts';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const customers = await fetchFilteredCustomers('');

  return (
    <div className="w-full">
      <h1 className={`${lusitana.className} text-2xl`}>Customers</h1>
      <p className="mb-6 text-sm text-gray-500">
        Data from the backend (Render/Django API)
      </p>

      {customers.length === 0 ? (
        <p className="text-gray-400">No customers found.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Total Invoices</th>
                <th className="px-4 py-3">Total Paid</th>
                <th className="px-4 py-3">Total Pending</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{customer.name}</td>
                  <td className="px-4 py-3">{customer.email}</td>
                  <td className="px-4 py-3">{customer.total_invoices}</td>
                  <td className="px-4 py-3">{customer.total_paid}</td>
                  <td className="px-4 py-3">{customer.total_pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}