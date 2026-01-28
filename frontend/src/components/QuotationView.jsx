import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quotationAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './QuotationView.css';
import html2canvas from 'html2canvas';

// Import or reference your logo
// Place Emeena_logo.png in your public/assets/images folder
import logo from '../uploads/logo.png'; // Update this path based on your project structure
// Import brand logos (place in public/uploads/ or src/uploads/)
import hafeleLogo from '../uploads/hafele.png';   // or .svg/.jpg — adjust extension
import cocoLogo from '../uploads/coco.png';
import hettichLogo from '../uploads/hettich.png';

const QuotationView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const response = await quotationAPI.getById(id);
      setQuotation(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch quotation');
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
    // Only print the quotation-view div
    window.print();
  };

  const convertImageToBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // ... inside QuotationView component ...

  const handleDownloadPDF = async () => {
    const element = document.querySelector('.quotation-view.printable');
    if (!element) {
      toast.error('Quotation content not found');
      return;
    }

    try {
      // Show loading state (optional)
      toast.loading('Generating PDF...');

      // Capture the printable area as canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true, // For images from external domains
        allowTaint: true,
        logging: false,
      });

      // Get image data
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Calculate number of pages
      const totalPages = Math.ceil(imgHeight / pageHeight);
      const pdf = new jsPDF('p', 'mm', 'a4');

      // Add each page
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        const yPos = -i * pageHeight;
        pdf.addImage(imgData, 'PNG', 0, yPos, imgWidth, imgHeight, undefined, 'FAST');
      }

      // Save
      pdf.save(`${quotation.quotationNo}.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await quotationAPI.updateStatus(id, newStatus);
      toast.success('Status updated successfully!');
      fetchQuotation();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading quotation...</p>
      </div>
    );
  }

  if (!quotation) {
    return null;
  }

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

  const canUpdateStatus = user?.role === 'supervisor' || user?.role === 'admin';

  return (
    <div className="quotation-view-container">
      {/* Top Action Bar */}
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
          <button
            onClick={() => navigate(`/quotations/edit/${id}`)}
            className="btn btn-primary"
          >
            ✏️ Edit
          </button>
        </div>
      </div>

      {/* Status Controls (moved outside header) */}
      {canUpdateStatus && (
        <div className="status-actions no-print">
          <p><strong>Update Status:</strong></p>
          <div className="status-buttons">
            <button
              onClick={() => handleStatusChange('pending')}
              className="btn btn-sm btn-yellow"
              disabled={quotation.status === 'pending'}
            >
              Pending
            </button>
            <button
              onClick={() => handleStatusChange('approved')}
              className="btn btn-sm btn-green"
              disabled={quotation.status === 'approved'}
            >
              Approve
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              className="btn btn-sm btn-red"
              disabled={quotation.status === 'rejected'}
            >
              Reject
            </button>
            <button
              onClick={() => handleStatusChange('completed')}
              className="btn btn-sm btn-blue"
              disabled={quotation.status === 'completed'}
            >
              Complete
            </button>
          </div>
        </div>
      )}

      <div className="quotation-view printable">

        {/* Company Header */}
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

        <h2 className="quotation-title">QUOTATION</h2>

        <div className="quotation-info">
          <div className="info-section">
            <p><strong>Quotation No:</strong> {quotation.quotationNo}</p>
            <p><strong>Date:</strong> {format(new Date(quotation.date), 'dd/MM/yyyy')}</p>
            <p><strong>Valid Till:</strong> {format(new Date(quotation.validTill), 'dd/MM/yyyy')}</p>
            <p><strong>Prepared by:</strong> {quotation.preparedByName}</p>
            <p className="no-print">
              <strong>Status:</strong>{' '}
              <span className={`badge ${getStatusBadge(quotation.status)}`}>
                {quotation.status}
              </span>
            </p>
          </div>

          <div className="info-section">
            <p><strong>To:</strong></p>
            <p>{quotation.clientTitle} {quotation.clientName}</p>
            {quotation.clientCompany && <p>{quotation.clientCompany}</p>}
            <p>{quotation.clientAddress}</p>
            {quotation.clientPhone && <p>{quotation.clientPhone}</p>}
          </div>
        </div>

        {/* ALL Items Table - Show all rows */}
        <table className="items-table">
          <thead>
            <tr>
              <th style={{width: '8%'}}>No</th>
              <th style={{width: '40%'}}>Item</th>
              <th style={{width: '10%'}}>Qty</th>
              <th style={{width: '15%'}}>Line Fit</th>
              <th style={{width: '14%'}}>Unit Price</th>
              <th style={{width: '13%'}}>Total</th>
            </tr>
          </thead>
          <tbody>
            {quotation.items.map((item, index) => (
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
            <strong>{formatCurrency(quotation.subTotal)}</strong>
          </div>
          <div className="total-row">
            <span>Tax / VAT ({quotation.taxVAT}%):</span>
            <strong>{formatCurrency((quotation.subTotal * quotation.taxVAT) / 100)}</strong>
          </div>
          <div className="total-row">
            <span>Discount:</span>
            <strong>- {formatCurrency(quotation.discount)}</strong>
          </div>
          <div className="total-row grand-total">
            <span>Grand Total:</span>
            <strong>{formatCurrency(quotation.grandTotal)}</strong>
          </div>
        </div>

        {/* Brand Logos - Page 1 footer */}
        <div className="brand-logos-page1">
          <img src={hafeleLogo} alt="Häfele" className="brand-logo" />
          <img src={cocoLogo} alt="CoCo" className="brand-logo" />
          <img src={hettichLogo} alt="Hettich" className="brand-logo" />
        </div>

        <div className="page-break"></div>

        <div className="service-agreement">
          <h3>Service Agreement</h3>
          
          <div className="agreement-section">
            <h4>Payments</h4>
            <p>60% of the Grand total must be paid as the advanced payment. Balance payment should be done on the installation day at the project site on the agreed date.</p>
          </div>

          <div className="agreement-section">
            <h4>Warranty Period</h4>
            <ul>
              <li>Life time warranty for boards</li>
              <li>Fittings and partitioning 15 years warranty</li>
              <li>10 years warranty for pantry accessories - one to one replacement</li>
              <li>Warranty for electric items: Haflel Brand 5 years, Other brands 1 year</li>
              <li>1 year warranty for Door hinges</li>
            </ul>
          </div>

          <div className="agreement-section">
            <h4>Project Period</h4>
            <p>Customer must be available on agreed dates and times for taking measurements, inspections, and installation dates so the project will be completed smoothly and effectively.</p>
            
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>Measuring day</th>
                  <th>Inspection</th>
                  <th>Installation 1</th>
                  <th>Installation 2</th>
                  <th>Completion Date</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="agreement-section">
            <h4>After Service</h4>
            <p>Customer must keep all the warranty documents for relevant items and products safe. Customer is requested to provide necessary information before a physical inspection. Please contact the office via the Hotline number <strong>071 017 22 09</strong> or via official email address <strong>info@emeena.ecity.lk</strong></p>
          </div>

          <div className="agreement-section">
            <h4>Declaration</h4>
            <p>Here by I declare that I agree to the terms and conditions of the service agreement.</p>
            
            <div className="declaration-fields">
              <p>Date: ______________________________________________</p>
              <p>Quotation No: {quotation.quotationNo}</p>
              <p>Customer's name: ________________________________________________________________________</p>
              <p>NIC number / eCity.lk Membership Number: ______________________________________________</p>
              <p>Address of the project: ____________________________________________________________________</p>
            </div>
          </div>
        </div>

          {quotation.notes && (
            <div className="notes-section">
              <h4>Notes:</h4>
              <p>{quotation.notes}</p>
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
              {/* <p>Name: {quotation.preparedByName}</p>
              <p>Staff ID: _______</p> */}
              <p>Name: </p>
              <p>Staff ID: </p>
            </div>
          </div>

          {/* Brand Logos - Page 2 footer */}
          {/* <div className="brand-logos-page2">
            <img src={hafeleLogo} alt="Häfele" className="brand-logo" />
            <img src={cocoLogo} alt="CoCo" className="brand-logo" />
            <img src={hettichLogo} alt="Hettich" className="brand-logo" />
          </div> */}
        
      </div>
    </div>
  );
};

export default QuotationView;