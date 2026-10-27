import React, { useState, useEffect } from 'react';
import { FileBarChart, Download, Calendar, Filter } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useToast } from '../../hooks/useToast';
import { formatCurrency, formatUnits, formatDate } from '../../utils/formatters';

const reportTypes = [
  { id: 'monthly_consumption', name: 'Monthly Consumption Report' },
  { id: 'daily_consumption', name: 'Daily Consumption Report' },
  { id: 'yearly_consumption', name: 'Yearly Consumption Report' },
  { id: 'consumer_wise', name: 'Consumer-Wise Consumption & Billing' },
  { id: 'meter_wise', name: 'Meter Hardware Telemetry Report' },
  { id: 'billing_summary', name: 'Billing Ledger & Invoices Report' },
  { id: 'payment_summary', name: 'Payment Transactions Ledger' },
  { id: 'outstanding_bills', name: 'Outstanding Unpaid Invoices' }
];

const ReportsPage = () => {
  const toast = useToast();
  const [selectedType, setSelectedType] = useState('monthly_consumption');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchReport = async (type) => {
    try {
      setLoading(true);
      const res = await api.post('/reports/generate', { report_type: type, save: true });
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to generate report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(selectedType);
  }, [selectedType]);

  const handleDownloadCsv = async () => {
    setIsDownloading(true);
    try {
      const response = await api.get(`/reports/${selectedType}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedType}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV report downloaded successfully');
    } catch (err) {
      toast.error('Failed to export CSV: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Analytics & Regulatory Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export daily, monthly, consumer-wise, and billing reports from database records.
          </p>
        </div>
        <Button onClick={handleDownloadCsv} isLoading={isDownloading} icon={Download} variant="primary">
          Export Report to CSV
        </Button>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {reportTypes.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setSelectedType(rt.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
              selectedType === rt.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
            }`}
          >
            {rt.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(reportData.summary || {}).map(([key, val]) => (
              <div key={key} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-xl font-bold text-slate-900 mt-1 block">
                  {typeof val === 'number' && key.includes('amount') || key.includes('paid') || key.includes('billed') || key.includes('outstanding')
                    ? formatCurrency(val)
                    : typeof val === 'number' && key.includes('units')
                    ? `${val} kWh`
                    : val}
                </span>
              </div>
            ))}
          </div>

          {/* Report Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Detailed Statement Rows ({reportData.rows?.length || 0} records)
              </h3>
              <span className="text-xs text-slate-400">Generated: {formatDate(reportData.generated_at)}</span>
            </div>

            {reportData.rows?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                      {Object.keys(reportData.rows[0]).map((header) => (
                        <th key={header} className="p-3">
                          {header.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {reportData.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        {Object.entries(row).map(([k, v], cellIdx) => (
                          <td key={cellIdx} className="p-3">
                            {typeof v === 'number' && (k.includes('amount') || k.includes('balance') || k.includes('paid') || k.includes('billed'))
                              ? formatCurrency(v)
                              : typeof v === 'number' && k.includes('units')
                              ? `${v} kWh`
                              : v === null || v === undefined
                              ? 'N/A'
                              : String(v)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching records found for this report.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ReportsPage;
