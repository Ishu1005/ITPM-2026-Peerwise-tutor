import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_BASE } from '../config/api';

axios.defaults.withCredentials = true;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString();
}

function PaymentHistoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/auth/session`, { withCredentials: true })
      .then(res => {
        if (!res.data.user) {
          navigate('/login');
          return;
        }
        if (res.data.user.role !== 'student') {
          toast.error('Payment history is for students only');
          navigate('/home');
          return;
        }
        setUser(res.data.user);
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    axios
      .get(`${API_BASE}/api/payments/history`, { withCredentials: true })
      .then(res => setRows(res.data))
      .catch(() => toast.error('Could not load payment history'))
      .finally(() => setLoading(false));
  }, [user]);

  const downloadPdf = async invoiceNumber => {
    try {
      const res = await axios.get(`${API_BASE}/api/payments/invoice/${invoiceNumber}/pdf`, {
        responseType: 'blob',
        withCredentials: true,
      });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment history</h1>
          <button
            type="button"
            onClick={() => navigate('/payment-gateway')}
            className="px-4 py-2 rounded-lg bg-wyzant-teal text-white font-semibold hover:bg-wyzant-teal-dark"
          >
            New payment
          </button>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          {loading ? (
            <p className="p-8 text-center text-gray-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-left text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Module / plan</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Promo</th>
                    <th className="px-4 py-3">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(p => (
                    <tr key={p._id} className="border-t border-gray-100 hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {p.moduleName || p.moduleId}
                        {p.kind === 'subscription' && (
                          <span className="ml-2 text-xs text-wyzant-teal">Subscription</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div>Rs. {p.amount}</div>
                        {p.discountAmount > 0 && (
                          <div className="text-xs text-gray-500 line-through">Rs. {p.originalAmount}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            p.status === 'success'
                              ? 'text-green-700 font-semibold'
                              : p.status === 'failed'
                                ? 'text-red-600 font-semibold'
                                : 'text-amber-700'
                          }
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-600">{p.promoCode || '—'}</td>
                      <td className="px-4 py-3">
                        {p.invoice?.invoiceNumber ? (
                          <button
                            type="button"
                            onClick={() => downloadPdf(p.invoice.invoiceNumber)}
                            className="text-wyzant-teal font-semibold hover:underline"
                          >
                            Download PDF
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentHistoryPage;
