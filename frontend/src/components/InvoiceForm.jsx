import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { quotationAPI, invoiceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './InvoiceForm.css';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
      { itemName: 'Office Table', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Wardrobe', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Iron board', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Dressing tables', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Extra light', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Railing', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Transport', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Other charges', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Vanity cupboard', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Island table', quantity: 0, lineFit: '', unitPrice: 0, total: 0 },
      { itemName: 'Other', quantity: 0, lineFit: '', unitPrice: 0, total: 0 }
    ],
    taxVAT: 0,
    discount: 0,
    advancePaid: 0,
    payments: [],
    status: 'draft',
    notes: '',
    quotationId: null, // Changed to null instead of empty string
    isDuplicate: false,
    duplicatedFromInvoiceNo: ''
  });

  // Draft entry for the "add payment" row on the form.
  const [newPayment, setNewPayment] = useState({
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    note: ''
  });

  // Whether this form was opened as a duplicate of an existing invoice.
  // Computed synchronously so it's already true on the very first render,
  // before calculateTotals can auto-fill the advance to 60%.
  const isDuplicateSource = !!location.state?.duplicateFrom;

  // Tracks whether the user has manually typed an advance amount.
  // While false, the advance auto-fills to 60% of the grand total.
  // For duplicates the advance is a fixed carried value, so start "edited".
  const [advanceEdited, setAdvanceEdited] = useState(isDuplicateSource);

  // True when this form is a duplicate of a previous invoice. In that case the
  // advance is carried exactly from the parent (no 60% suggestion) and locked.
  const [duplicateMode, setDuplicateMode] = useState(isDuplicateSource);

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

  // Pre-fill the form when creating a copy of an existing invoice.
  // The source invoice is passed via router state (see Dashboard / InvoiceView).
  useEffect(() => {
    const source = location.state?.duplicateFrom;
    if (!source) return;

    // Parent's advance, exactly as recorded (no 60% suggestion).
    const parentAdvance =
      source.advancePaid != null
        ? source.advancePaid
        : Math.round((source.grandTotal || 0) * 0.6 * 100) / 100;

    // Parent's individual payments, carried over and locked.
    const carriedPayments = Array.isArray(source.payments)
      ? source.payments.map(p => ({
          amount: Number(p.amount) || 0,
          date: p.date ? format(new Date(p.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          note: p.note || '',
          carried: true
        }))
      : [];

    setFormData(prev => ({
      ...prev,
      // Fresh date for the new invoice, keep everything else from the source.
      date: format(new Date(), 'yyyy-MM-dd'),
      clientTitle: source.clientTitle || 'Mr.',
      clientName: source.clientName || '',
      clientCompany: source.clientCompany || '',
      clientAddress: source.clientAddress || '',
      clientPhone: source.clientPhone || '',
      items: (source.items && source.items.length > 0)
        ? source.items.map(it => ({
            itemName: it.itemName || '',
            quantity: it.quantity || 0,
            lineFit: it.lineFit || '',
            unitPrice: it.unitPrice || 0,
            total: it.total || 0
          }))
        : prev.items,
      taxVAT: source.taxVAT || 0,
      discount: source.discount || 0,
      // Carry the parent's advance exactly, plus its individual payments.
      advancePaid: parentAdvance,
      payments: carriedPayments,
      status: 'draft',
      notes: source.notes || '',
      quotationId: null,
      isDuplicate: true,
      duplicatedFromInvoiceNo: source.invoiceNo || ''
    }));
    setDuplicateMode(true);
    // Advance is a fixed carried value (no 60% auto-fill).
    setAdvanceEdited(true);
    toast.success('Invoice copied. Advance and previous payments carried over.');
    // Clear the router state so a refresh doesn't re-trigger the copy.
    window.history.replaceState({}, document.title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.taxVAT, formData.discount, advanceEdited, duplicateMode]);

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

    // Until the user manually types an advance amount, keep it suggested at 60%.
    // In duplicate mode the field is a fixed "Paid" amount, so never auto-fill.
    if (!advanceEdited && !duplicateMode) {
      setFormData(prev => ({
        ...prev,
        advancePaid: Math.round(grandTotal * 0.6 * 100) / 100
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAdvanceChange = (e) => {
    setAdvanceEdited(true);
    setFormData(prev => ({
      ...prev,
      advancePaid: parseFloat(e.target.value) || 0
    }));
  };

  const resetAdvanceToDefault = () => {
    setAdvanceEdited(false);
  };

  // Sum of extra payments added on the form (not counting the advance).
  const paymentsTotal = formData.payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );
  // Everything paid so far = advance + extra payments.
  const totalPaid = Math.round(((Number(formData.advancePaid) || 0) + paymentsTotal) * 100) / 100;

  const handleAddPayment = () => {
    const amount = parseFloat(newPayment.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }
    setFormData(prev => ({
      ...prev,
      payments: [
        ...prev.payments,
        {
          amount,
          date: newPayment.date || format(new Date(), 'yyyy-MM-dd'),
          note: newPayment.note || ''
        }
      ]
    }));
    setNewPayment({
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      note: ''
    });
  };

  const handleRemovePayment = (index) => {
    setFormData(prev => ({
      ...prev,
      // Carried-over payments from the parent invoice cannot be removed.
      payments: prev.payments.filter((p, i) => i !== index || p.carried)
    }));
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
    // Auto-fill client details and items from the selected quotation.
    // Items are copied into the editable table so they can be adjusted.
    setFormData(prev => ({
      ...prev,
      clientTitle: quotation.clientTitle || 'Mr.',
      clientName: quotation.clientName || '',
      clientCompany: quotation.clientCompany || '',
      clientAddress: quotation.clientAddress || '',
      clientPhone: quotation.clientPhone || '',
      items: (quotation.items && quotation.items.length > 0)
        ? quotation.items.map(it => ({
            itemName: it.itemName || '',
            quantity: it.quantity || 0,
            lineFit: it.lineFit || '',
            unitPrice: it.unitPrice || 0,
            total: it.total || 0
          }))
        : prev.items,
      taxVAT: quotation.taxVAT || 0,
      discount: quotation.discount || 0,
      quotationId: quotation._id // This will be a valid ObjectId or null
    }));

    toast.success('Client details and items filled from quotation');
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
        // Persist only the payment fields the model expects (drop UI-only flags).
        payments: (formData.payments || []).map(p => ({
          amount: Number(p.amount) || 0,
          date: p.date,
          note: p.note || ''
        })),
        subTotal: totals.subTotal,
        grandTotal: totals.grandTotal,
        preparedBy: user?._id,
        preparedByName: user?.fullName,
        // Reflect how much has been paid so far in the status.
        status:
          totalPaid >= totals.grandTotal && totals.grandTotal > 0
            ? 'paid'
            : totalPaid > 0
              ? 'partial'
              : formData.status,
        // Only include quotationId if it's not null
        ...(formData.quotationId && { quotationId: formData.quotationId })
      };

      // Remove quotationId if it's null to avoid empty string
      if (!formData.quotationId) {
        delete submitData.quotationId;
      }

      const response = await invoiceAPI.create(submitData);
      toast.success('Invoice created successfully!');

      // Go straight to the newly created invoice's view page.
      const newId = response?.data?.data?._id;
      if (newId) {
        navigate(`/invoices/view/${newId}`);
      } else {
        navigate('/dashboard?tab=invoices');
      }
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
                  <th style={{ width: '5%' }}>No</th>
                  <th style={{ width: '40%' }}>Item</th>
                  <th style={{ width: '10%' }}>Qty</th>
                  <th style={{ width: '15%' }}>Line fit</th>
                  <th style={{ width: '15%' }}>Unit Price</th>
                  <th style={{ width: '15%' }}>Total</th>
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
              <strong>If the balance payment is not made within 3 days after installation, the item will have to be uninstalled and taken back.</strong>
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
              <strong>Pantry up | Pantry bottom | Granite | Quartz | TV Wall | Design Wall | Dressing Room | Wardrobe Dressing Table | Bar area | Salon, shop and all interior designs | Office Table | Wardrobe | Iron board | Dressing tables | Extra light | Railing | Transport | Other charges | Vanity cupboard | Island table | Other</strong>
            </p>
            <p>
              <strong>Sink | Tap | Burner | Cooker hood | Plate rack | Cup and saucer rack | Cutlery tray | Bottle pullout | Spice pullout cabinet | Larder unit | Magic cover pullout | Dustbin rack | Glass frame bar</strong>
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

              {duplicateMode ? (
                <div className="total-row advance-payment advance-paid-row">
                  <span>
                    Advance Paid:
                    <em className="advance-hint"> (carried from previous invoice)</em>
                  </span>
                  <input
                    type="number"
                    className="advance-paid-input advance-locked"
                    value={formData.advancePaid}
                    readOnly
                    tabIndex={-1}
                  />
                </div>
              ) : (
                <div className="total-row advance-payment advance-paid-row">
                  <span>
                    Advance Paid:
                    {!advanceEdited && (
                      <em className="advance-hint"> (60% suggested)</em>
                    )}
                    {advanceEdited && (
                      <button
                        type="button"
                        className="advance-reset-btn"
                        onClick={resetAdvanceToDefault}
                        title="Reset to 60% of grand total"
                      >
                        reset to 60%
                      </button>
                    )}
                  </span>
                  <input
                    type="number"
                    className="advance-paid-input"
                    value={formData.advancePaid}
                    onChange={handleAdvanceChange}
                    min="0"
                    step="0.01"
                    onWheel={(e) => e.currentTarget.blur()}
                  />
                </div>
              )}
              {formData.payments.map((p, i) => (
                <div className="total-row" key={i}>
                  <span>
                    Payment {i + 1}
                    {p.date ? ` (${format(new Date(p.date), 'dd/MM/yyyy')})` : ''}:
                  </span>
                  <strong>- {formatCurrency(p.amount)}</strong>
                </div>
              ))}
              <div className="total-row total-paid-row">
                <span>Total Paid:</span>
                <strong>{formatCurrency(totalPaid)}</strong>
              </div>
              <div className="total-row">
                <span>
                  {totals.grandTotal - totalPaid >= 0
                    ? 'Balance Payment:'
                    : 'Overpaid (refund/credit):'}
                </span>
                <strong>
                  {formatCurrency(Math.abs(totals.grandTotal - totalPaid))}
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Payments</h2>
          <div className="payments-manager-form">
            <div className="payments-summary">
              <span>Advance Paid: <strong>{formatCurrency(formData.advancePaid)}</strong></span>
              <span>Total Paid: <strong>{formatCurrency(totalPaid)}</strong></span>
              <span>Balance: <strong>{formatCurrency(Math.abs(totals.grandTotal - totalPaid))}</strong></span>
            </div>

            {formData.payments.length > 0 && (
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Note</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.payments.map((p, i) => (
                    <tr key={i} className={p.carried ? 'carried-payment-row' : ''}>
                      <td>{i + 1}</td>
                      <td>{p.date ? format(new Date(p.date), 'dd/MM/yyyy') : '-'}</td>
                      <td>{formatCurrency(p.amount)}</td>
                      <td>{p.note || '-'}</td>
                      <td>
                        {p.carried ? (
                          <span className="carried-tag">Carried</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemovePayment(i)}
                            className="btn btn-sm btn-danger"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="add-payment-row">
              <input
                type="number"
                placeholder="Amount"
                value={newPayment.amount}
                min="0"
                step="0.01"
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                onWheel={(e) => e.currentTarget.blur()}
              />
              <input
                type="date"
                value={newPayment.date}
                onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={newPayment.note}
                onChange={(e) => setNewPayment({ ...newPayment, note: e.target.value })}
              />
              <button
                type="button"
                onClick={handleAddPayment}
                className="btn btn-sm btn-green"
              >
                + Add Payment
              </button>
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