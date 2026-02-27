import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { invoiceAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './InvoiceView.css';
import html2canvas from 'html2canvas';
import logo from '../uploads/logo.png';
import hafeleLogo from '../uploads/hafele.png';
import cocoLogo from '../uploads/coco.png';
import hettichLogo from '../uploads/hettich.png';

const InvoiceView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await invoiceAPI.getById(id);
      setInvoice(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch invoice');
      navigate('/dashboard');
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.querySelector('.invoice-view.printable');
    if (!element) {
      toast.error('Invoice content not found');
      return;
    }

    try {
      toast.loading('Generating PDF...');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.invoice-view.printable');
          if (clonedElement) {
            // Force Print-like dimensions and styles
            clonedElement.style.width = '210mm';
            clonedElement.style.minHeight = '297mm';
            clonedElement.style.padding = '10mm';
            clonedElement.style.margin = '0';
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.borderRadius = '0';
            clonedElement.style.fontSize = '10pt';
            clonedElement.style.lineHeight = '1.2';

            const smallTexts = clonedElement.querySelectorAll('p, li');
            smallTexts.forEach(txt => {
              txt.style.fontSize = '8.5pt';
              txt.style.lineHeight = '1.2';
              txt.style.margin = '2px 0';
            });

            const smallTexts2 = clonedElement.querySelectorAll('span, strong');
            smallTexts2.forEach(txt => {
              txt.style.fontSize = '8.5pt';
              txt.style.lineHeight = '1.2';
              txt.style.margin = '0';
            });

            const totalsSection = clonedElement.querySelector('.totals-section');
            totalsSection.style.maxWidth = '100%';
            totalsSection.style.width = '100%';

            const signatureBox = clonedElement.querySelectorAll('.signature-box p');
            signatureBox.forEach(txt => {
              txt.style.paddingLeft = '80px';
              txt.style.paddingTop = '10px';
              txt.style.margin = '0px 0px';
            });

            // Sync internal elements to match the print CSS precisely
            const tableCells = clonedElement.querySelectorAll('.items-table th, .items-table td');
            tableCells.forEach(cell => {
              cell.style.padding = '3px 4px';
              cell.style.fontSize = '9pt';
              cell.style.border = '1px solid #000';
            });

            const infoPs = clonedElement.querySelectorAll('.info-section p');
            infoPs.forEach(p => {
              p.style.margin = '2px 0';
              p.style.fontSize = '8.5pt';
            });

            const totals = clonedElement.querySelectorAll('.total-row');
            totals.forEach(row => {
              row.style.fontSize = '9pt';
              row.style.padding = '2px 0';
            });

            const headings = clonedElement.querySelectorAll('h2, h3, h4');
            headings.forEach(h => {
              if (h.classList.contains('invoice-title')) {
                h.style.fontSize = '14pt';
                h.style.margin = '0 0 10px';
              } else {
                h.style.fontSize = '10pt';
                h.style.margin = '0 0 5px';
              }
            });

            // Make brand logos small in PDF
            const brandLogos = clonedElement.querySelectorAll('.brand-logo');
            brandLogos.forEach(logo => {
              logo.style.height = '24px';
              logo.style.width = 'auto';
            });

            // Make business logo (company logo) height match company details height
            const businessLogo = clonedElement.querySelector('.company-logo img');
            const companyDetails = clonedElement.querySelector('.company-details');
            if (businessLogo && companyDetails) {
              businessLogo.style.height = `${companyDetails.offsetHeight}px`;
              businessLogo.style.width = 'auto';
            }

            const serviceAgreement = clonedElement.querySelector('.service-agreement');
            if (serviceAgreement) {
              const beforeElements = [];
              let curr = serviceAgreement.previousElementSibling;
              while (curr) {
                beforeElements.unshift(curr);
                curr = curr.previousElementSibling;
              }

              const page1Wrapper = clonedDoc.createElement('div');
              // A4 height (297mm) - top/bottom padding (10mm total) = 287mm
              page1Wrapper.style.minHeight = '287mm';
              page1Wrapper.style.display = 'flex';
              page1Wrapper.style.flexDirection = 'column';

              beforeElements.forEach(el => page1Wrapper.appendChild(el));
              clonedElement.insertBefore(page1Wrapper, serviceAgreement);
            }

          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const totalPages = Math.ceil(imgHeight / pageHeight);
      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        const yPos = -i * pageHeight;
        pdf.addImage(imgData, 'PNG', 0, yPos, imgWidth, imgHeight, undefined, 'FAST');
      }

      pdf.save(`${invoice.invoiceNo}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await invoiceAPI.updateStatus(id, newStatus);
      toast.success('Status updated successfully!');
      fetchInvoice();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-gray',
      pending: 'badge-yellow',
      paid: 'badge-green',
      partial: 'badge-blue'
    };
    return badges[status] || 'badge-gray';
  };

  const canUpdateStatus = user?.role === 'supervisor' || user?.role === 'admin';

  return (
    <div className="invoice-view-container">
      <div className="view-header no-print">
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          ← Back
        </button>
        <div className="header-actions">
          <button onClick={handlePrint} className="btn btn-secondary">
            🖨️ Print
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-secondary">
            📥 Download PDF
          </button>
        </div>
      </div>

      {canUpdateStatus && (
        <div className="status-actions no-print">
          <p><strong>Update Status:</strong></p>
          <div className="status-buttons">
            <button
              onClick={() => handleStatusChange('pending')}
              className="btn btn-sm btn-yellow"
              disabled={invoice.status === 'pending'}
            >
              Pending
            </button>
            <button
              onClick={() => handleStatusChange('paid')}
              className="btn btn-sm btn-green"
              disabled={invoice.status === 'paid'}
            >
              Mark as Paid
            </button>
            <button
              onClick={() => handleStatusChange('partial')}
              className="btn btn-sm btn-blue"
              disabled={invoice.status === 'partial'}
            >
              Partial Payment
            </button>
          </div>
        </div>
      )}

      <div className="invoice-view printable">
        <div className="company-header">
          <div className="company-logo">
            <img src={logo} alt="Emeena Interior Designers" />
          </div>
          <div className="company-details">
            <p><strong>EMEENA INTERIOR DESIGNERS</strong></p>
            <p>22RC+726, Weliweriya</p>
            <p>071 017 22 09 / 076 900 89 78</p>
            <p>info@emeena.ecity.lk</p>
          </div>
        </div>

        <h2 className="invoice-title">INVOICE</h2>

        <div className="invoice-info">
          <div className="info-section">
            <p><strong>Invoice No:</strong> {invoice.invoiceNo}</p>
            <p><strong>Date:</strong> {format(new Date(invoice.date), 'dd/MM/yyyy')}</p>
            <p><strong>Prepared by:</strong> {invoice.preparedByName}</p>
            <p className="no-print">
              <strong>Status:</strong>{' '}
              <span className={`badge ${getStatusBadge(invoice.status)}`}>
                {invoice.status}
              </span>
            </p>
          </div>

          <div className="info-section">
            <p><strong>To: </strong>{invoice.clientTitle} {invoice.clientName}</p>
            {invoice.clientCompany && <p>{invoice.clientCompany}</p>}
            <p>{invoice.clientAddress}</p>
            {invoice.clientPhone && <p>{invoice.clientPhone}</p>}
          </div>
        </div>

        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>No</th>
              <th style={{ width: '40%' }}>Item</th>
              <th style={{ width: '10%' }}>Qty</th>
              <th style={{ width: '15%' }}>Line fit</th>
              <th style={{ width: '14%' }}>Unit Price</th>
              <th style={{ width: '13%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td className="text-center">{index + 1}</td>
                <td>{item.itemName}</td>
                <td className="text-center">{item.quantity || ''}</td>
                <td>{item.lineFit || ''}</td>
                <td className="text-right">{item.unitPrice ? formatCurrency(item.unitPrice) : ''}</td>
                <td className="text-right">{item.total ? formatCurrency(item.total) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals-section">
          <div className="total-row">
            <span>Sub Total:</span>
            <strong>{formatCurrency(invoice.subTotal)}</strong>
          </div>
          <div className="total-row">
            <span>Tax / VAT ({invoice.taxVAT}%):</span>
            <strong>{formatCurrency((invoice.subTotal * invoice.taxVAT) / 100)}</strong>
          </div>
          <div className="total-row">
            <span>Discount:</span>
            <strong>- {formatCurrency(invoice.discount)}</strong>
          </div>
          <div className="total-row grand-total">
            <span>Grand Total:</span>
            <strong>{formatCurrency(invoice.grandTotal)}</strong>
          </div>
          <div className="total-row advance-payment">
            <span>Advance Payment (60%):</span>
            <strong>{formatCurrency(invoice.grandTotal * 0.6)}</strong>
          </div>
          <div className="total-row">
            <span>Balance Payment (40%):</span>
            <strong>{formatCurrency(invoice.grandTotal * 0.4)}</strong>
          </div>
        </div>

        <div className="service-agreement">
          <div className="agreement-section">
            <h4>Regulations</h4>
            <p>60% of the Grand total must be paid as the advanced payment. Balance payment should be done on the installation day at the project site. Customer must keep all the warranty documents for relevant items and products safe.</p>
          </div>

          <div className="agreement-section">
            <h4>Our Services</h4>
            <p><strong>Pantry up | Pantry bottom | Granite | Quartz | TV Wall | Design Wall | Dressing Room | Wardrobe Dressing Table | Bar area | Salon, shop and all interior designs | Design Table | Other</strong></p>
            <p><strong>Sink | Tap | Burner | Cooker hood | Plate rack | Cup and saucer rack | Cutlery tray | Bottle pullout | Spice pullout cabinet | Larder unit | Magic cover pullout | Dustbin rack | Glass frame bar</strong></p>
          </div>

          {invoice.notes && (
            <div className="notes-section">
              <h4>Notes:</h4>
              <p>{invoice.notes}</p>
            </div>
          )}

          <div className="signature-section">
            <div className="signature-box">
              <div className="signature-line"></div>
              <p>Signature of the Customer</p>
            </div>
            <div className="signature-box">
              <div className="signature-line"></div>
              <p>Signature of the Project Manager</p>
              <p>Name: {invoice.preparedByName}</p>
              <p>Staff ID:</p>
            </div>
          </div>
        </div>

        {/* Brand Logos at the bottom */}
        <div className="brand-logos-bottom">
          <img src={hafeleLogo} alt="Häfele" className="brand-logo" />
          <img src={cocoLogo} alt="CoCo" className="brand-logo" />
          <img src={hettichLogo} alt="Hettich" className="brand-logo" />
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;