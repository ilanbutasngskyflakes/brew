/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import {
  FiArrowLeft,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiDownload,
  FiPrinter,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiShoppingCart
} from "react-icons/fi";
import * as XLSX from "xlsx";

export default function CashFlowReport() {
  const [transactions, setTransactions] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [filterType, setFilterType] = useState("all");

  const navigate = useNavigate();

  /* ============================
     FETCH DATA
  ============================ */
  useEffect(() => {
    fetchTransactions();
    fetchSalesData();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/cashflow");

      // IMPORTANT: adjust if your backend wraps data
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

      setTransactions(data);
    } catch (err) {
      console.error("Cashflow fetch error:", err);
      showModal("error", "Failed to load cash flow data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesData = async () => {
    try {
      const res = await api.get("/order");
      const orders = Array.isArray(res.data) ? res.data : res.data?.data || [];
      
      // Calculate today's sales
      const today = new Date().toLocaleDateString("en-CA");
      const todayOrders = orders.filter(o => 
        new Date(o.created_at).toLocaleDateString("en-CA") === today
      );
      
      const grossSales = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const totalDiscount = todayOrders.reduce((sum, o) => sum + Number(o.discount || 0), 0);
      const netRevenue = grossSales - totalDiscount;
      
      setSalesData({ grossSales, totalDiscount, netRevenue });
    } catch (err) {
      console.error("Sales data fetch error:", err);
    }
  };

  /* ============================
     HELPERS
  ============================ */
  const showModal = (type, message) =>
    setModal({ show: true, type, message });

  const closeModal = () =>
    setModal({ show: false, type: "", message: "" });

  const handleDelete = async id => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await api.delete(`/cashflow/${id}`);
      showModal("success", "Transaction deleted successfully.");
      fetchTransactions();
    } catch {
      showModal("error", "Failed to delete transaction.");
    }
  };

  /* ============================
     FILTERING
  ============================ */
  const filteredTransactions = transactions.filter(t => {
    try {
      const dateMatch =
        new Date(t.date).toLocaleDateString("en-CA") === selectedDate;
      const typeMatch =
        filterType === "all" || t.type === filterType;
      return dateMatch && typeMatch;
    } catch {
      return false;
    }
  });

  /* ============================
     TOTALS
  ============================ */
  const calculateTotals = data => {
    const payin = data.reduce(
      (sum, t) => (t.type === "payin" ? sum + Number(t.amount) : sum),
      0
    );
    const payout = data.reduce(
      (sum, t) => (t.type === "payout" ? sum + Number(t.amount) : sum),
      0
    );

    return { payin, payout, balance: payin - payout };
  };

  const dailyTotals = calculateTotals(filteredTransactions);
  const allTotals = calculateTotals(transactions);

  // Actual Cash includes sales revenue
  const actualCashWithSales = dailyTotals.balance + (salesData?.netRevenue || 0);

  /* ============================
     EXPORT
  ============================ */
  const exportToExcel = () => {
    const rows = [
      ["Barcelo Cafe - Cash Flow Report"],
      ["Date:", selectedDate],
      ["Generated:", new Date().toLocaleString()],
      [],
      ["Daily Summary"],
      ["Pay In", `₱${dailyTotals.payin.toFixed(2)}`],
      ["Pay Out", `₱${dailyTotals.payout.toFixed(2)}`],
      ["Balance", `₱${dailyTotals.balance.toFixed(2)}`],
      [],
      ["Transactions"],
      ["Date & Time", "Type", "Category", "Description", "Amount"]
    ];

    filteredTransactions.forEach(t => {
      rows.push([
        new Date(t.date).toLocaleString(),
        t.type.toUpperCase(),
        t.category,
        t.description,
        `₱${Number(t.amount).toFixed(2)}`
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");
    
    ws["!cols"] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
      { wch: 12 }
    ];

    XLSX.writeFile(wb, `cashflow_${selectedDate}.xlsx`);
    showModal("success", "Report exported successfully!");
  };

  const printReport = () => {
    const printWindow = window.open("", "_blank");
    const content = `
      <html>
      <head>
        <title>Cash Flow Report - ${selectedDate}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            padding: 20mm;
            font-size: 11px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 15px;
            border-bottom: 2px solid #073dbe;
            padding-bottom: 10px;
          }
          .header h1 { 
            font-size: 18px;
            color: #073dbe;
            margin-bottom: 3px;
          }
          .date {
            font-size: 12px;
            color: #64748b;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 15px 0;
          }
          .summary-card {
            border: 1px solid #e2e8f0;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
          }
          .summary-label {
            font-size: 9px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 3px;
          }
          .summary-value {
            font-size: 14px;
            color: #0f172a;
            font-weight: bold;
          }
          .section-title {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
            margin: 15px 0 8px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #e2e8f0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10px;
          }
          th {
            background: #073dbe;
            color: white;
            padding: 6px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 9px;
          }
          td {
            padding: 5px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .type-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .payin {
            background: #dcfce7;
            color: #166534;
          }
          .payout {
            background: #fee2e2;
            color: #991b1b;
          }
          @media print {
            body { padding: 20mm; }
            @page { size: A4; margin: 20mm; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Barcelo Cafe</h1>
          <div class="date">Cash Flow Report - ${selectedDate}</div>
          <div class="date">Generated: ${new Date().toLocaleString()}</div>
        </div>

        <div class="section-title">Daily Summary</div>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Pay In</div>
            <div class="summary-value" style="color: #16a34a;">₱${dailyTotals.payin.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Pay Out</div>
            <div class="summary-value" style="color: #dc2626;">₱${dailyTotals.payout.toFixed(2)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Balance</div>
            <div class="summary-value">₱${dailyTotals.balance.toFixed(2)}</div>
          </div>
        </div>

        <div class="section-title">Transactions</div>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.length > 0
              ? filteredTransactions
                  .map(
                    t => `
              <tr>
                <td>${new Date(t.date).toLocaleString()}</td>
                <td><span class="type-badge ${t.type}">${t.type}</span></td>
                <td>${t.category}</td>
                <td>${t.description}</td>
                <td style="text-align: right; font-weight: bold;">₱${Number(t.amount).toFixed(2)}</td>
              </tr>
            `
                  )
                  .join("")
              : '<tr><td colspan="5" style="text-align: center;">No transactions</td></tr>'
            }
          </tbody>
        </table>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  /* ============================
     UI
  ============================ */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading cash flow data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#073dbe] hover:text-[#052d99] font-medium mb-4 transition-colors"
        >
          <FiArrowLeft size={18} />
          Back
        </button>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="bg-[#073dbe] p-2.5 rounded-lg">
                <FiDollarSign className="text-white text-xl" />
              </div>
              Money Transactions
            </h1>
            <p className="text-slate-600 mt-2 text-sm">Track all cash movements and petty cash transactions</p>
          </div>
          <button
            onClick={() => navigate("/dashboard/cashflow/new")}
            className="w-full lg:w-auto bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-2.5 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
          >
            <FiPlus size={18} />
            New Transaction
          </button>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                />
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Type</label>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none cursor-pointer text-sm"
              >
                <option value="all">All Transactions</option>
                <option value="payin">Pay In Only</option>
                <option value="payout">Pay Out Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <FiTrendingUp className="text-green-600" size={24} />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">Today</span>
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">Pay In</p>
            <h2 className="text-green-600 text-2xl font-bold">
              ₱{dailyTotals.payin.toFixed(2)}
            </h2>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <FiTrendingDown className="text-red-600" size={24} />
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">Today</span>
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">Pay Out</p>
            <h2 className="text-red-600 text-2xl font-bold">
              ₱{dailyTotals.payout.toFixed(2)}
            </h2>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <FiDollarSign className="text-[#073dbe]" size={24} />
              </div>
              <span className="text-xs font-semibold text-[#073dbe] bg-blue-50 px-2 py-1 rounded">Balance</span>
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">Actual Cash</p>
            <h2 className={`text-2xl font-bold ${actualCashWithSales >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
              ₱{actualCashWithSales.toFixed(2)}
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Transactions: ₱{dailyTotals.balance.toFixed(2)} + Sales: ₱{(salesData?.netRevenue || 0).toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-50 p-3 rounded-lg">
                <FiShoppingCart className="text-purple-600" size={24} />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded">Expected</span>
            </div>
            <p className="text-slate-600 text-sm font-medium mb-1">Expected from Sales</p>
            <h2 className="text-purple-600 text-2xl font-bold">
              ₱{salesData?.netRevenue.toFixed(2) || '0.00'}
            </h2>
            <p className="text-xs text-slate-500 mt-2">Gross: ₱{salesData?.grossSales.toFixed(2) || '0.00'} - Discount: ₱{salesData?.totalDiscount.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={exportToExcel}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
          >
            <FiDownload size={18} />
            Export to Excel
          </button>
          <button
            onClick={printReport}
            className="flex-1 bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
          >
            <FiPrinter size={18} />
            Print Report
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              Transactions for {selectedDate} ({filteredTransactions.length})
            </h3>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiDollarSign className="text-slate-400 text-2xl" />
              </div>
              <p className="text-base text-slate-600 font-medium">No transactions found for this date</p>
              <button
                onClick={() => navigate("/dashboard/cashflow/new")}
                className="mt-4 bg-[#073dbe] hover:bg-[#052d99] text-white px-4 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <FiPlus size={16} />
                Add Transaction
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(t.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-block px-2.5 py-1 rounded font-semibold text-xs text-white ${
                          t.type === 'payin' ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          {t.type === 'payin' ? '↓ IN' : '↑ OUT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                        {t.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {t.description}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-bold ${
                        t.type === 'payin' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {t.type === 'payin' ? '+' : '-'}₱{Number(t.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              navigate(`/dashboard/cashflow/${t.id}/edit`)
                            }
                            className="bg-[#073dbe] hover:bg-[#052d99] text-white p-2 rounded-lg transition-all"
                            title="Edit"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-all"
                            title="Delete"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                modal.type === "success" ? "bg-green-100" : "bg-red-100"
              }`}>
                {modal.type === "success" ? (
                  <FiCheckCircle size={24} className="text-green-600" />
                ) : (
                  <FiAlertCircle size={24} className="text-red-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {modal.type === "success" ? "Success" : "Error"}
              </h3>
            </div>
            
            <p className="text-slate-600 mb-6">{modal.message}</p>
            
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  modal.type === "success"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
