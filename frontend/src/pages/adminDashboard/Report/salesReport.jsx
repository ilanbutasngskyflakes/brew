import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { FiDownload, FiPrinter, FiCalendar, FiTrendingUp, FiDollarSign, FiShoppingCart } from "react-icons/fi";
import * as XLSX from 'xlsx';

export default function SalesReportPage() {
  const [orders, setOrders] = useState([]);
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await api.get("/order");
      setOrders(data || []);
    } catch (err) {
      console.error("Cannot load orders:", err);
    }
  };

  const filterOrdersByPeriod = () => {
    const now = new Date();
    
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      
      switch(reportType) {
        case "daily":
          const selected = new Date(selectedDate);
          return orderDate.toDateString() === selected.toDateString();
          
        case "weekly":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);
          return orderDate >= weekStart && orderDate <= weekEnd;
          
        case "monthly":
          const [year, month] = selectedMonth.split('-');
          return orderDate.getFullYear() === parseInt(year) && 
                 orderDate.getMonth() === parseInt(month) - 1;
          
        case "yearly":
          return orderDate.getFullYear() === parseInt(selectedYear);
          
        default:
          return true;
      }
    });
  };

  const calculateStats = (filteredOrders) => {
    const totalSales = filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const totalDiscount = filteredOrders.reduce((sum, order) => sum + Number(order.discount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Product sales breakdown
    const productSales = {};
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const key = `${item.product_name} - ${item.variant_name}`;
        if (!productSales[key]) {
          productSales[key] = {
            product: item.product_name,
            variant: item.variant_name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[key].quantity += item.quantity;
        productSales[key].revenue += Number(item.subtotal || 0);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalSales,
      totalOrders,
      totalDiscount,
      averageOrderValue,
      topProducts
    };
  };

  const filteredOrders = filterOrdersByPeriod();
  const stats = calculateStats(filteredOrders);

  const getPeriodLabel = () => {
    switch(reportType) {
      case "daily":
        return new Date(selectedDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case "weekly":
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `Week of ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
      case "monthly":
        const [year, month] = selectedMonth.split('-');
        return new Date(year, month - 1).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
      case "yearly":
        return `Year ${selectedYear}`;
      default:
        return "";
    }
  };

  const exportToExcel = () => {
    // Summary data
    const summaryData = [
      ['Barcelo Cafe - Sales Report'],
      ['Period:', getPeriodLabel()],
      ['Generated:', new Date().toLocaleString()],
      [],
      ['Summary Statistics'],
      ['Total Sales:', `₱${stats.totalSales.toFixed(2)}`],
      ['Total Orders:', stats.totalOrders],
      ['Total Discounts:', `₱${stats.totalDiscount.toFixed(2)}`],
      ['Average Order Value:', `₱${stats.averageOrderValue.toFixed(2)}`],
      [],
      ['Top Selling Products'],
      ['Product', 'Variant', 'Quantity Sold', 'Revenue'],
      ...stats.topProducts.map(p => [p.product, p.variant, p.quantity, `₱${p.revenue.toFixed(2)}`]),
      [],
      ['Order Details'],
      ['Order ID', 'Date', 'Total', 'Discount', 'Status', 'Items']
    ];

    // Order details
    const orderData = filteredOrders.map(order => [
      order.id,
      new Date(order.created_at).toLocaleString(),
      `₱${Number(order.total).toFixed(2)}`,
      `₱${Number(order.discount || 0).toFixed(2)}`,
      order.status,
      order.items?.length || 0
    ]);

    const allData = [...summaryData, ...orderData];

    const ws = XLSX.utils.aoa_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');

    // Set column widths
    ws['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 10 }
    ];

    const fileName = `sales_report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank', 'height=800,width=800');
    if (!printWindow) {
      alert('Popup blocked. Please allow popups to print.');
      return;
    }

    const content = `
      <html>
      <head>
        <title>Sales Report - ${getPeriodLabel()}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 30px;
            max-width: 1000px;
            margin: 0 auto;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 20px;
          }
          .header h1 { 
            margin: 0;
            color: #4F46E5;
            font-size: 28px;
          }
          .period { 
            font-size: 18px;
            color: #666;
            margin-top: 10px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            border: 2px solid #E5E7EB;
            padding: 20px;
            border-radius: 8px;
            background: #F9FAFB;
          }
          .stat-label {
            font-size: 14px;
            color: #6B7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .stat-value {
            font-size: 32px;
            color: #1F2937;
            font-weight: bold;
            margin-top: 8px;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1F2937;
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #E5E7EB;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th {
            background: #4F46E5;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
          }
          td {
            padding: 10px 12px;
            border-bottom: 1px solid #E5E7EB;
          }
          tr:hover {
            background: #F9FAFB;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            color: #6B7280;
            font-size: 12px;
          }
          @media print {
            body { padding: 20px; }
            .stat-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Barcelo Cafe</h1>
          <div class="period">Sales Report - ${getPeriodLabel()}</div>
          <div style="font-size: 12px; color: #9CA3AF; margin-top: 10px;">
            Generated on ${new Date().toLocaleString()}
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Sales</div>
            <div class="stat-value">₱${stats.totalSales.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">${stats.totalOrders}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Discounts</div>
            <div class="stat-value">₱${stats.totalDiscount.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Average Order Value</div>
            <div class="stat-value">₱${stats.averageOrderValue.toFixed(2)}</div>
          </div>
        </div>

        ${stats.topProducts.length > 0 ? `
          <div class="section-title">Top Selling Products</div>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product</th>
                <th>Variant</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${stats.topProducts.map((product, idx) => `
                <tr>
                  <td><strong>#${idx + 1}</strong></td>
                  <td>${product.product}</td>
                  <td>${product.variant}</td>
                  <td>${product.quantity}</td>
                  <td><strong>₱${product.revenue.toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${filteredOrders.length > 0 ? `
          <div class="section-title">Order Details</div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date & Time</th>
                <th>Items</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(order => `
                <tr>
                  <td><strong>#${order.id}</strong></td>
                  <td>${new Date(order.created_at).toLocaleString()}</td>
                  <td>${order.items?.length || 0} items</td>
                  <td>${order.discount > 0 ? `₱${Number(order.discount).toFixed(2)}` : '-'}</td>
                  <td><strong>₱${Number(order.total).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p style="text-align: center; color: #6B7280; padding: 40px;">No orders found for this period.</p>'}

        <div class="footer">
          <div>Barcelo Cafe - La Consolacion College</div>
          <div>Galo-Gatuslao-Rizal Streets, Bacolod City, Philippines, 6100</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 flex items-center gap-3">
                <div className="bg-indigo-600 p-3 rounded-xl shadow-lg">
                  <FiTrendingUp className="text-white text-2xl" />
                </div>
                Sales Report
              </h1>
              <p className="text-gray-600 mt-2 ml-1">View and export sales data</p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <button
                onClick={() => navigate("/cashier")}
                className="flex-1 lg:flex-none bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white rounded-xl shadow-xl p-6 mb-6 border-2 border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FiCalendar className="text-indigo-600" />
            Select Report Period
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' }
            ].map(type => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value)}
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  reportType === type.value
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Date Selectors */}
          <div className="flex flex-col sm:flex-row gap-3">
            {reportType === 'daily' && (
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
            )}
            
            {reportType === 'monthly' && (
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                />
              </div>
            )}
            
            {reportType === 'yearly' && (
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <FiDollarSign className="text-green-600 text-2xl" />
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-600 uppercase">Total Sales</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">₱{stats.totalSales.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiShoppingCart className="text-blue-600 text-2xl" />
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-600 uppercase">Total Orders</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">{stats.totalOrders}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <FiTrendingUp className="text-red-600 text-2xl" />
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-600 uppercase">Total Discounts</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">₱{stats.totalDiscount.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <FiDollarSign className="text-purple-600 text-2xl" />
              </div>
            </div>
            <div className="text-sm font-semibold text-gray-600 uppercase">Avg Order Value</div>
            <div className="text-3xl font-bold text-gray-800 mt-2">₱{stats.averageOrderValue.toFixed(2)}</div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={exportToExcel}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-2"
          >
            <FiDownload className="text-xl" />
            Export to Excel
          </button>
          <button
            onClick={printReport}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold flex items-center justify-center gap-2"
          >
            <FiPrinter className="text-xl" />
            Print Report
          </button>
        </div>

        {/* Top Products */}
        {stats.topProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-6 mb-6 border-2 border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Top Selling Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Variant</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Qty Sold</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topProducts.map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg text-white font-bold">
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{product.product}</td>
                      <td className="px-6 py-4 text-gray-600">{product.variant}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-800">{product.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600">₱{product.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Orders for {getPeriodLabel()} ({filteredOrders.length})
          </h3>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-lg text-gray-500 font-medium">No orders found for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase">Items</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Discount</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-bold text-indigo-600">#{order.id}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {order.items?.length || 0} items
                      </td>
                      <td className="px-6 py-4 text-right">
                        {order.discount > 0 ? (
                          <span className="text-red-600 font-semibold">
                            ₱{Number(order.discount).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-800">
                        ₱{Number(order.total).toFixed(2)}
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