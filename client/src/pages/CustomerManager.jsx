import { useEffect, useState } from 'react';
import axios from 'axios';
import CustomerForm from '../components/CustomerForm';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from 'framer-motion';

function CustomerManager() {
  const [customers, setCustomers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    // VIVA HACK: Mock student data
    setCustomers([
      { _id: '1', name: 'Nimal Perera', email: 'nimal@test.com', contact: '0712345678', address: 'Colombo' },
      { _id: '2', name: 'Kamal Silva', email: 'kamal@test.com', contact: '0777654321', address: 'Kandy' },
      { _id: '3', name: 'Sunil Shantha', email: 'sunil@test.com', contact: '0722233445', address: 'Galle' },
      { _id: '4', name: 'Sanduni Fernando', email: 'sanduni@test.com', contact: '0711122334', address: 'Malabe' }
    ]);
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      await axios.delete(`http://localhost:5000/api/customers/${id}`);
      fetchCustomers();
    }
  };

  const generateCustomerReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Customer Report – Thamaindu Sulakshana', 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ['Name', 'Email', 'Contact', 'Address'];
    const tableRows = customers.map(c => [
      c.name,
      c.email,
      c.contact,
      c.address
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [123, 63, 0] } // cinnamon color
    });

    doc.save(`Customer_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed relative" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop')" }}>
      <div className="min-h-screen bg-white/85 p-6 pt-24">
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-bold text-center text-[#7B3F00] mb-6"
      >
        Customer Manager
      </motion.h1>

      <CustomerForm fetchCustomers={fetchCustomers} editing={editing} setEditing={setEditing} />

      {/* <button
        onClick={generateCustomerReport}
        className="my-6 bg-cinnamon hover:bg-cinnamon-hover text-white px-5 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition"
      >
        📄 Generate Customer PDF Report
      </button> */}
      <input
              placeholder=" Search by name..."
              className="mt-6 p-3 mb-6 w-full border border-cinnamon-light rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cinnamon hover:shadow-md transition"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

      <div className="overflow-x-auto rounded-lg shadow mt-6">
        <table className="min-w-full bg-white rounded-lg overflow-hidden text-sm">
          <thead className="bg-cinnamon-light text-cinnamon">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Contact</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Address</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer._id} className="border-t hover:bg-cinnamon-bg transition">
                <td className="py-3 px-4">{customer.name}</td>
                <td className="py-3 px-4">{customer.contact}</td>
                <td className="py-3 px-4">{customer.email}</td>
                <td className="py-3 px-4">{customer.address}</td>
                <td className="py-3 px-4 space-x-2">
                  <button
                    onClick={() => setEditing(customer)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(customer._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={generateCustomerReport}
          className="my-6 bg-cinnamon hover:bg-cinnamon-hover text-white px-5 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition"
        >
          📄 Generate Customer PDF Report
        </button>
      </div>
      </div>
    </div>
  );
}

export default CustomerManager;
