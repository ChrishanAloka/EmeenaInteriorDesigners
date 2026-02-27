import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quotationAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './QuotationForm.css';

const QuotationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    validTill: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    clientTitle: 'Mr.',
    clientName: '',
    clientCompany: '',
    clientAddress: '',
    clientPhone: '',
    items: [
      { itemName: 'Pantry up', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Pantry bottom', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Granite', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Quartz', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'TV Wall', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Design Wall', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Dressing Room', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Wardrobe Dressing Table', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Bar area', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Salon interior designs', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Shop interior designs', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Other interior designs', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Sink', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Tap', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Burner', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Cooker hood', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Plate rack', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Cup and saucer rack', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Cutlery tray', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Bottle pullout', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Spice pullout cabinet', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Larder unit', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Magic cover pullout', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Dustbin rack', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Glass frame bar', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Design Table', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Other', quantity: 0, lineFit: '', unitPrice: 0, total: 0 }
    ],
    taxVAT: 0,
    discount: 0,
    status: 'draft',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    subTotal: 0,
    grandTotal: 0
  });

  useEffect(() => {
    if (isEditMode) {
      fetchQuotation();
    }
  }, [id]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.taxVAT, formData.discount]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await quotationAPI.getById(id);
      const data = response.data.data;

      setFormData({
        ...data,
        date: format(new Date(data.date), 'yyyy-MM-dd'),
        validTill: format(new Date(data.validTill), 'yyyy-MM-dd')
      });
    } catch (error) {
      toast.error('Failed to fetch quotation');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const subTotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const taxAmount = (subTotal * formData.taxVAT) / 100;
    const grandTotal = subTotal + taxAmount - formData.discount;

    setTotals({ subTotal, grandTotal });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = field === 'lineFit' ? value : parseFloat(value) || 0;

    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientName || !formData.clientAddress) {
      toast.error('Please fill in all required client information');
      return;
    }

    try {
      setLoading(true);

      const submitData = {
        ...formData,
        subTotal: totals.subTotal,
        grandTotal: totals.grandTotal
      };

      if (isEditMode) {
        await quotationAPI.update(id, submitData);
        toast.success('Quotation updated successfully!');
      } else {
        await quotationAPI.create(submitData);
        toast.success('Quotation created successfully!');
      }

      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR'
    }).format(amount || 0);
  };

  if (loading && isEditMode) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading quotation...</p>
      </div>
    );
  }

  return (
    <div className="quotation-form-container">
      <div className="form-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
        <h1>{isEditMode ? 'Edit Quotation' : 'Create New Quotation'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="quotation-form">
        <div className="form-section">
          <h2>Quotation Details</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Valid Till *</label>
              <input
                type="date"
                name="validTill"
                value={formData.validTill}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Prepared By</label>
              <input
                type="text"
                value={user?.fullName}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                {user?.role === 'supervisor' || user?.role === 'admin' ? (
                  <>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </>
                ) : null}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Client Information</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Title *</label>
              <select
                name="clientTitle"
                value={formData.clientTitle}
                onChange={handleInputChange}
                required
              >
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
                <option value="Prof.">Prof.</option>
              </select>
            </div>

            <div className="form-group">
              <label>Client Name *</label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label>Company</label>
              <input
                type="text"
                name="clientCompany"
                value={formData.clientCompany}
                onChange={handleInputChange}
                placeholder="ABC (Pvt) Ltd."
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleInputChange}
                placeholder="07X XXX XXXX"
              />
            </div>

            <div className="form-group full-width">
              <label>Address *</label>
              <input
                type="text"
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleInputChange}
                placeholder="Client address"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Items</h2>
          <div className="table-responsive">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Item</th>
                  <th style={{ width: '12%' }}>Qty</th>
                  <th style={{ width: '18%' }}></th>
                  <th style={{ width: '15%' }}>Unit Price</th>
                  <th style={{ width: '15%' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.itemName}</td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="1"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.lineFit}
                        onChange={(e) => handleItemChange(index, 'lineFit', e.target.value)}
                        placeholder="Line fit"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        min="0"
                        step="0.01"
                        onWheel={(e) => e.currentTarget.blur()}
                      />
                    </td>
                    <td>
                      <strong>{formatCurrency(item.total)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-section">
          <h2>Totals</h2>
          <div className="totals-grid">
            <div className="totals-left">
              <div className="form-group">
                <label>Tax/VAT (%)</label>
                <input
                  type="number"
                  name="taxVAT"
                  value={formData.taxVAT}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Discount (LKR)</label>
                <input
                  type="number"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="totals-summary">
              <div className="total-row">
                <span>Sub Total:</span>
                <strong>{formatCurrency(totals.subTotal)}</strong>
              </div>
              <div className="total-row">
                <span>Tax/VAT ({formData.taxVAT}%):</span>
                <strong>{formatCurrency((totals.subTotal * formData.taxVAT) / 100)}</strong>
              </div>
              <div className="total-row">
                <span>Discount:</span>
                <strong>- {formatCurrency(formData.discount)}</strong>
              </div>
              <div className="total-row grand-total">
                <span>Grand Total:</span>
                <strong>{formatCurrency(totals.grandTotal)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditMode ? 'Update Quotation' : 'Create Quotation')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;