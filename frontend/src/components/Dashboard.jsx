import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quotationAPI, invoiceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [invoiceStats, setInvoiceStats] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('quotations'); // 'quotations' or 'invoices'
  
  const [filters, setFilters] = useState({
    status: '',
    clientName: '',
    page: 1
  });
  
  const [invoiceFilters, setInvoiceFilters] = useState({
    status: '',
    clientName: '',
    page: 1
  });

  useEffect(() => {
    fetchData();
  }, [filters, invoiceFilters, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'quotations') {
        const [statsRes, quotationsRes] = await Promise.all([
          quotationAPI.getStats(),
          quotationAPI.getAll(filters)
        ]);
        setStats(statsRes.data.data);
        setQuotations(quotationsRes.data.data.quotations);
      } else {
        const [statsRes, invoicesRes] = await Promise.all([
          invoiceAPI.getStats(),
          invoiceAPI.getAll(invoiceFilters)
        ]);
        setInvoiceStats(statsRes.data.data);
        setInvoices(invoicesRes.data.data.invoices);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
      page: 1
    });
  };

  const handleInvoiceFilterChange = (e) => {
    setInvoiceFilters({
      ...invoiceFilters,
      [e.target.name]: e.target.value,
      page: 1
    });
  };

  const handleDeleteQuotation = async (id) => {
    try {
      await quotationAPI.delete(id);
      toast.success('Quotation deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete quotation');
    }
  };

  const handleDeleteInvoice = async (id) => {
    try {
      await invoiceAPI.delete(id);
      toast.success('Invoice deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-gray',
      pending: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red',
      completed: 'badge-blue',
      paid: 'badge-green',
      partial: 'badge-yellow'
    };
    return badges[status] || 'badge-gray';
  };

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Draft',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      completed: 'Completed',
      paid: 'Paid',
      partial: 'Partial'
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.fullName}!</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#667eea'}}>📊</div>
          <div className="stat-content">
            <h3>{stats?.totalQuotations || 0}</h3>
            <p>Total Quotations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#48bb78'}}>✅</div>
          <div className="stat-content">
            <h3>
              {stats?.statusBreakdown?.find(s => s._id === 'approved')?.count || 0}
            </h3>
            <p>Approved Quotations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#3182ce'}}>🧾</div>
          <div className="stat-content">
            <h3>{invoiceStats?.totalInvoices || 0}</h3>
            <p>Total Invoices</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#f56565'}}>💰</div>
          <div className="stat-content">
            <h3>{formatCurrency(invoiceStats?.totalRevenue || 0)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'quotations' ? 'active' : ''}`}
          onClick={() => setActiveTab('quotations')}
        >
          📊 Quotations
        </button>
        <button
          className={`tab-button ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          🧾 Invoices
        </button>
      </div>

      {/* Quotations Section */}
      {activeTab === 'quotations' && (
        <div className="quotations-section">
          <div className="section-header">
            <h2>Recent Quotations</h2>
            <div className="section-actions">
              <Link to="/quotations/create" className="btn btn-primary">
                ➕ New Quotation
              </Link>
            </div>
          </div>
          
          <div className="filters">
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
            <input
              type="text"
              name="clientName"
              placeholder="Search by client name..."
              value={filters.clientName}
              onChange={handleFilterChange}
            />
          </div>

          <div className="table-container">
            <table className="quotations-table">
              <thead>
                <tr>
                  <th>Quotation No</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Valid Till</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{textAlign: 'center', padding: '40px'}}>
                      No quotations found. Create your first quotation!
                    </td>
                  </tr>
                ) : (
                  quotations.map((quotation) => (
                    <tr key={quotation._id}>
                      <td>
                        <strong>{quotation.quotationNo}</strong>
                      </td>
                      <td>
                        {quotation.clientTitle} {quotation.clientName}
                      </td>
                      <td>{format(new Date(quotation.date), 'dd/MM/yyyy')}</td>
                      <td>{format(new Date(quotation.validTill), 'dd/MM/yyyy')}</td>
                      <td>
                        <strong>{formatCurrency(quotation.grandTotal)}</strong>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(quotation.status)}`}>
                          {getStatusLabel(quotation.status)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/quotations/view/${quotation._id}`}
                            className="btn btn-sm btn-secondary"
                          >
                            View
                          </Link>
                          <Link
                            to={`/quotations/edit/${quotation._id}`}
                            className="btn btn-sm btn-primary"
                          >
                            Edit
                          </Link>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
                                  handleDeleteQuotation(quotation._id);
                                }
                              }}
                              className="btn btn-sm btn-danger"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoices Section */}
      {activeTab === 'invoices' && (
        <div className="invoices-section">
          <div className="section-header">
            <h2>Recent Invoices</h2>
            <div className="section-actions">
              <Link to="/invoices/create" className="btn btn-primary">
                ➕ Create Invoice
              </Link>
            </div>
          </div>
          
          <div className="filters">
            <select name="status" value={invoiceFilters.status} onChange={handleInvoiceFilterChange}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial Payment</option>
            </select>
            <input
              type="text"
              name="clientName"
              placeholder="Search by client name..."
              value={invoiceFilters.clientName}
              onChange={handleInvoiceFilterChange}
            />
          </div>

          <div className="table-container">
            <table className="quotations-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>
                      No invoices found. Create your first invoice!
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice._id}>
                      <td>
                        <strong>{invoice.invoiceNo}</strong>
                      </td>
                      <td>
                        {invoice.clientTitle} {invoice.clientName}
                      </td>
                      <td>{format(new Date(invoice.date), 'dd/MM/yyyy')}</td>
                      <td>
                        <strong>{formatCurrency(invoice.grandTotal)}</strong>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Link
                            to={`/invoices/view/${invoice._id}`}
                            className="btn btn-sm btn-secondary"
                          >
                            View
                          </Link>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
                                  handleDeleteInvoice(invoice._id);
                                }
                              }}
                              className="btn btn-sm btn-danger"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;