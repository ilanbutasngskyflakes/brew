/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/immutability */
/* eslint-disable no-case-declarations */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { FiDownload, FiPrinter, FiCalendar, FiTrendingUp, FiShoppingCart, FiArrowLeft, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import * as XLSX from 'xlsx';

export default function SalesReportPage() {
  const [orders, setOrders] = useState([]);
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, type: "", message: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/order");
        setOrders(data || []);
        console.log("Orders loaded:", data);
      } catch (err) {
        showModal("error", "Failed to load orders. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const showModal = (type, message) => {
    setModal({ show: true, type, message });
  };

  const closeModal = () => {
    setModal({ show: false, type: "", message: "" });
  };

  // Calculate discount amount based on per-item discounts
  const getDiscountAmount = (order) => {
    // ✅ FIXED: Calculate total discount from items (each item with discount = 5)
    if (order.items && order.items.length > 0) {
      return order.items.reduce((sum, item) => {
        // Only count items that have a discount type
        if (item.discount_type && (item.discount_type === 'senior' || item.discount_type === 'pwd')) {
          // Discount is 5 per item (not per quantity)
          return sum + 5;
        }
        return sum;
      }, 0);
    }
    return 0;
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
    
    // ✅ FIXED: Calculate total discount from per-item discounts ONLY
    const totalDiscount = filteredOrders.reduce((sum, order) => {
      return sum + getDiscountAmount(order);
    }, 0);
    
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

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
      totalDiscount,  // ✅ Per-item discount total
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
    try {
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
        ['Order ID', 'Date', 'Discounted Items', 'Total Discount', 'Total', 'Items']
      ];

      const orderData = filteredOrders.map(order => {
        // ✅ NEW: Get discounted items list
        const discountedItems = order.items?.filter(item => 
          item.discount_type && (item.discount_type === 'senior' || item.discount_type === 'pwd')
        ) || [];
        
        return [
          order.id,
          new Date(order.created_at).toLocaleString(),
          discountedItems.map(item => `${item.product_name} (${item.discount_type.toUpperCase()})`).join(', ') || '-',
          getDiscountAmount(order) > 0 ? `₱${getDiscountAmount(order).toFixed(2)}` : '-',
          `₱${Number(order.total).toFixed(2)}`,
          order.items?.length || 0
        ];
      });

      const allData = [...summaryData, ...orderData];
      const ws = XLSX.utils.aoa_to_sheet(allData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');

      ws['!cols'] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 10 }
      ];

      const fileName = `sales_report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showModal("success", "Report exported successfully!");
    } catch (error) {
      showModal("error", "Failed to export report. Please try again.");
    }
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank', 'height=800,width=800');
    if (!printWindow) {
      showModal("error", "Popup blocked. Please allow popups to print.");
      return;
    }

    const content = `
      <html>
      <head>
        <title>Sales Report - ${getPeriodLabel()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 20mm;
            font-size: 11px;
            line-height: 1.4;
            width: 210mm;
            margin: 0 auto;
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
          .period { 
            font-size: 12px;
            color: #64748b;
            margin-top: 3px;
          }
          .generated {
            font-size: 9px;
            color: #94a3b8;
            margin-top: 3px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 15px;
          }
          .stat-card {
            border: 1px solid #e2e8f0;
            padding: 10px;
            border-radius: 4px;
            background: #f8fafc;
          }
          .stat-label {
            font-size: 9px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .stat-value {
            font-size: 16px;
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
          .rank {
            display: inline-block;
            background: #073dbe;
            color: white;
            font-weight: bold;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
          }
          .discount-badge {
            display: inline-block;
            background: #ef4444;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            margin-right: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 9px;
            color: #64748b;
          }
          @media print {
            body { 
              padding: 20mm;
              width: 210mm;
            }
            .stat-card { 
              break-inside: avoid;
              page-break-inside: avoid;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            thead {
              display: table-header-group;
            }
            @page { 
              size: A4;
              margin: 20mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Barcelo Cafe</h1>
          <div class="period">Sales Report - ${getPeriodLabel()}</div>
          <div class="generated">Generated: ${new Date().toLocaleString()}</div>
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
            <div class="stat-label">Discounts</div>
            <div class="stat-value">₱${stats.totalDiscount.toFixed(2)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Avg Order</div>
            <div class="stat-value">₱${stats.averageOrderValue.toFixed(2)}</div>
          </div>
        </div>

        ${stats.topProducts.length > 0 ? `
          <div class="section-title">Top Selling Products</div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">Rank</th>
                <th>Product</th>
                <th>Variant</th>
                <th style="text-align: right; width: 60px;">Qty</th>
                <th style="text-align: right; width: 80px;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${stats.topProducts.map((product, idx) => `
                <tr>
                  <td><span class="rank">#${idx + 1}</span></td>
                  <td style="font-weight: 600;">${product.product}</td>
                  <td>${product.variant}</td>
                  <td style="text-align: right; font-weight: 600;">${product.quantity}</td>
                  <td style="text-align: right; font-weight: bold;">₱${product.revenue.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${filteredOrders.length > 0 ? `
          <div class="section-title">Order Details (${filteredOrders.length} orders)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 60px;">ID</th>
                <th>Date & Time</th>
                <th style="text-align: center; width: 50px;">Items</th>
                <th style="text-align: center; width: 150px;">Discounted Items</th>
                <th style="text-align: right; width: 80px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(order => {
                // ✅ FIXED: Only show items that have discounts
                const discountedItems = order.items?.filter(item => 
                  item.discount_type && (item.discount_type === 'senior' || item.discount_type === 'pwd')
                ) || [];
                
                const orderDiscount = getDiscountAmount(order);
                
                return `
                  <tr>
                    <td style="font-weight: bold; color: #073dbe;">#${order.id}</td>
                    <td>${new Date(order.created_at).toLocaleString()}</td>
                    <td style="text-align: center;">${order.items?.length || 0}</td>
                    <td style="text-align: center;">
                      ${discountedItems.length > 0 
                        ? discountedItems.map(item => `<span class="discount-badge">${item.product_name} (${item.discount_type.toUpperCase()})</span>`).join('') + `<br/>Total: ₱${orderDiscount.toFixed(2)}`
                        : 'None'}
                    </td>
                    <td style="text-align: right; font-weight: bold;">₱${Number(order.total).toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : '<p style="text-align: center; color: #64748b; padding: 20px;">No orders for this period.</p>'}

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
    }, 250);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#073dbe] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#073dbe] hover:text-[#052d99] font-medium mb-4 transition-colors text-sm"
          >
            <FiArrowLeft size={18} />
            Back
          </button>
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="bg-[#073dbe] p-2.5 rounded-lg">
                  <FiTrendingUp className="text-white text-xl" />
                </div>
                Sales Report
              </h1>
              <p className="text-slate-600 mt-1 text-sm">View and export sales analytics</p>
            </div>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 lg:p-6 mb-4">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FiCalendar className="text-[#073dbe]" size={18} />
            Report Period
          </h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[{
              value: 'daily',
              label: 'Daily'
            }, {
              value: 'weekly',
              label: 'Weekly'
            }, {
              value: 'monthly',
              label: 'Monthly'
            }, {
              value: 'yearly',
              label: 'Yearly'
            }].map(type => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                  reportType === type.value
                    ? 'bg-[#073dbe] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                />
              </div>
            )}
            
            {reportType === 'monthly' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none text-sm"
                />
              </div>
            )}
            
            {reportType === 'yearly' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:border-[#073dbe] focus:ring-2 focus:ring-blue-100 transition-all outline-none cursor-pointer text-sm"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-50 p-2.5 rounded-lg text-green-600 font-bold text-lg">
                ₱
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Sales (Revenue)</div>
            <div className="text-2xl font-bold text-slate-900">₱{stats.totalSales.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-red-50 p-2.5 rounded-lg">
                <FiTrendingUp className="text-red-600" size={20} />
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Discounts</div>
            <div className="text-2xl font-bold text-slate-900">₱{stats.totalDiscount.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600 font-bold text-lg">
                #
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Total Orders</div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalOrders}</div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <button
            onClick={exportToExcel}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
          >
            <FiDownload size={18} />
            Export to Excel
          </button>
          <button
            onClick={printReport}
            className="flex-1 bg-[#073dbe] hover:bg-[#052d99] text-white px-5 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2 text-sm"
          >
            <FiPrinter size={18} />
            Print Report
          </button>
        </div>

        {/* Top Products */}
        {stats.topProducts.length > 0 && (
          <div className="bg-white rounded-lg border border-slate-200 p-4 lg:p-6 mb-4">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Top Selling Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Rank</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Variant</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Qty Sold</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.topProducts.map((product, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center w-7 h-7 bg-[#073dbe] rounded-lg text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 text-sm">{product.product}</td>
                      <td className="px-4 py-3 text-slate-600 text-sm">{product.variant}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 text-sm">{product.quantity}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#073dbe] text-sm">₱{product.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 lg:p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Orders for {getPeriodLabel()} ({filteredOrders.length})
          </h3>
          
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShoppingCart className="text-slate-400 text-2xl" />
              </div>
              <p className="text-base text-slate-600 font-medium">No orders found for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Date & Time</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Items Ordered</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase">Discount</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => {
                    const discountedItems = order.items?.filter(item => 
                      item.discount_type && (item.discount_type === 'senior' || item.discount_type === 'pwd')
                    ) || [];
                    
                    return (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-bold text-[#073dbe] text-sm">#{order.id}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          {new Date(order.created_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          {order.items && order.items.length > 0 ? (
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                                  <span className="font-medium text-slate-900">
                                    {item.product_name} ({item.variant_name})
                                  </span>
                                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">
                                    x{item.quantity}
                                  </span>
                                  {item.discount_type && item.discount > 0 && (
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                                      {item.discount_type.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">No items</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {discountedItems.length > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {discountedItems.map((item, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-block bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold uppercase"
                                  >
                                    {item.discount_type}
                                  </span>
                                ))}
                              </div>
                              <span className="text-red-600 font-bold">-₱{getDiscountAmount(order).toFixed(2)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm">
                          ₱{Number(order.total).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
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