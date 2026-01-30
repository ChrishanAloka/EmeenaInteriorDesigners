import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationAPI, invoiceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './InvoiceForm.css';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    preparedBy: user?.fullName || '',
    clientTitle: 'Mr.',
    clientName: '',
    clientCompany: '',
    clientAddress: '',
    clientPhone: '',
    items: [
      { itemName: 'Pantry total fit', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Accessories', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Electric items', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Granite', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Quartz', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: '', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: '', quantity: 0, lineFit: '', unitPrice: 0, total: 0 }
    ],
    taxVAT: 0,
    discount: 0,
    status: 'draft',
    notes: '',
    quotationId: null // Changed to null instead of empty string
  });

  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingQuotations, setLoadingQuotations] = useState(true);
  const [totals, setTotals] = useState({
    subTotal: 0,
    grandTotal: 0
  });

  useEffect(() => {
    fetchQuotations();
  }, []);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.taxVAT, formData.discount]);

  const fetchQuotations = async () => {
    try {
      setLoadingQuotations(true);
      const response = await quotationAPI.getAll();
      setQuotations(response.data.data.quotations || []);
    } catch (error) {
      toast.error('Failed to fetch quotations');
    } finally {
      setLoadingQuotations(false);
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

  const handleQuotationSelect = (quotation) => {
    // Auto-fill client details from selected quotation
    setFormData(prev => ({
      ...prev,
      clientTitle: quotation.clientTitle || 'Mr.',
      clientName: quotation.clientName || '',
      clientCompany: quotation.clientCompany || '',
      clientAddress: quotation.clientAddress || '',
      clientPhone: quotation.clientPhone || '',
      quotationId: quotation._id // This will be a valid ObjectId or null
    }));
    
    toast.success('Client details filled from quotation');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.clientAddress) {
      toast.error('Please fill in all required client information');
      return;
    }

    try {
      setLoading(true);
      
      // Filter out completely empty items before submission
      const filteredItems = formData.items.filter(item => 
        item.itemName || item.quantity > 0 || item.unitPrice > 0 || item.lineFit
      );

      const submitData = {
        ...formData,
        items: filteredItems,
        subTotal: totals.subTotal,
        grandTotal: totals.grandTotal,
        preparedBy: user?._id,
        preparedByName: user?.fullName,
        // Only include quotationId if it's not null
        ...(formData.quotationId && { quotationId: formData.quotationId })
      };

      // Remove quotationId if it's null to avoid empty string
      if (!formData.quotationId) {
        delete submitData.quotationId;
      }

      await invoiceAPI.create(submitData);
      toast.success('Invoice created successfully!');
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Create invoice error:', error);
      toast.error(error.response?.data?.message || 'Failed to save invoice');
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

  return (
    <div className="invoice-form-container">
      <div className="form-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
        <h1>Create New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="invoice-form">
        <div className="form-section">
          <h2>Invoice Details</h2>
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
                    <option value="paid">Paid</option>
                    <option value="partial">Partial Payment</option>
                  </>
                ) : null}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Client Information</h2>
          <div className="quotation-selector">
            <label><strong>📋 Choose from Quotation:</strong></label>
            {loadingQuotations ? (
              <div className="loading-select">Loading quotations...</div>
            ) : quotations.length === 0 ? (
              <div className="no-quotations">No quotations available</div>
            ) : (
              <div className="quotation-list">
                {quotations.map(q => (
                  <button
                    key={q._id}
                    type="button"
                    className="quotation-card"
                    onClick={() => handleQuotationSelect(q)}
                  >
                    <div className="quotation-card-header">
                      <span className="quotation-no">{q.quotationNo}</span>
                      <span className="quotation-date">
                        {format(new Date(q.date), 'dd/MM/yyyy')}
                      </span>
                    </div>
                    <div className="quotation-card-body">
                      <p className="client-name">
                        {q.clientTitle} {q.clientName}
                      </p>
                      {q.clientCompany && (
                        <p className="client-company">{q.clientCompany}</p>
                      )}
                      <p className="client-address">{q.clientAddress}</p>
                      {q.clientPhone && (
                        <p className="client-phone">{q.clientPhone}</p>
                      )}
                    </div>
                    <div className="quotation-card-footer">
                      <span className="grand-total">
                        Total: {formatCurrency(q.grandTotal)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

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
                placeholder="Client name"
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
                placeholder="Company name"
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
          <h2>Invoice Items</h2>
          <div className="table-responsive">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{width: '5%'}}>No</th>
                  <th style={{width: '40%'}}>Item</th>
                  <th style={{width: '10%'}}>Qty</th>
                  <th style={{width: '15%'}}>Line fit</th>
                  <th style={{width: '15%'}}>Unit Price</th>
                  <th style={{width: '15%'}}>Total</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        placeholder="Item name"
                      />
                    </td>
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
          <h2>Regulations</h2>
          <div className="regulations-section">
            <p>
              <strong>60% of the Grand total must be paid as the advanced payment.</strong>
            </p>
            <p>
              <strong>Balance payment should be done on the installation day at the project site.</strong>
            </p>
            <p>
              <strong>Customer must keep all the warranty documents for relevant items and products safe.</strong>
            </p>
          </div>
        </div>

        <div className="form-section">
          <h2>Our Services</h2>
          <div className="services-section">
            <p>
              <strong>Pantry up | Pantry bottom | Granite | Quartz | TV Wall | Design Wall | Dressing Room | Wardrobe Dressing Table | Bar area | Salon, shop and all interior designs</strong>
            </p>
            <p>
              <strong>Sink | Burner | Cooker hood | Plate rack | Cup and saucer rack | Cutlery tray | Bottle pullout | Spice</strong>
            </p>
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
              <div className="total-row advance-payment">
                <span>Advance Payment (60%):</span>
                <strong>{formatCurrency(totals.grandTotal * 0.6)}</strong>
              </div>
              <div className="total-row">
                <span>Balance Payment (40%):</span>
                <strong>{formatCurrency(totals.grandTotal * 0.4)}</strong>
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
            {loading ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;