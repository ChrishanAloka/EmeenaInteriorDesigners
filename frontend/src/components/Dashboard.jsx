import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { quotationAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    clientName: '',
    page: 1
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, quotationsRes] = await Promise.all([
        quotationAPI.getStats(),
        quotationAPI.getAll(filters)
      ]);
      
      setStats(statsRes.data.data);
      setQuotations(quotationsRes.data.data.quotations);
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

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-gray',
      pending: 'badge-yellow',
      approved: 'badge-green',
      rejected: 'badge-red',
      completed: 'badge-blue'
    };
    return badges[status] || 'badge-gray';
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
        {/* <Link to="/quotations/create" className="btn btn-primary">
          + Create New Quotation
        </Link> */}
      </div>

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
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#ed8936'}}>⏳</div>
          <div className="stat-content">
            <h3>
              {stats?.statusBreakdown?.find(s => s._id === 'pending')?.count || 0}
            </h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#f56565'}}>💰</div>
          <div className="stat-content">
            <h3>{formatCurrency(stats?.totalRevenue || 0)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      <div className="quotations-section">
        <div className="section-header">
          <h2>Recent Quotations</h2>
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
                        {quotation.status}
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;