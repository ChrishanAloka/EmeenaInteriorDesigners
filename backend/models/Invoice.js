import mongoose from 'mongoose';

const invoiceItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    // Make optional to allow empty rows
    required: function () {
      // Only require if quantity, unitPrice, or lineFit has a value
      return this.quantity > 0 || this.unitPrice > 0 || (this.lineFit && this.lineFit.trim() !== '');
    }
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0
  },
  lineFit: {
    type: String,
    default: ''
  },
  unitPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    default: 0,
    min: 0
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  preparedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  preparedByName: {
    type: String,
    required: true
  },
  clientTitle: {
    type: String,
    enum: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'],
    default: 'Mr.'
  },
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientCompany: {
    type: String,
    trim: true
  },
  clientAddress: {
    type: String,
    required: true,
    trim: true
  },
  clientPhone: {
    type: String,
    trim: true
  },
  items: {
    type: [invoiceItemSchema],
    default: [
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
    ]
  },
  subTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  taxVAT: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  grandTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'paid', 'partial'],
    default: 'draft'
  },
  notes: {
    type: String,
    default: ''
  },
  quotationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation',
    // Make optional
    required: false
  }
}, {
  timestamps: true
});

// Pre-save hook to generate invoice number
invoiceSchema.pre('validate', async function (next) {
  if (this.isNew && !this.invoiceNo) {
    try {
      const lastInvoice = await this.constructor
        .findOne()
        .sort({ createdAt: -1 })
        .select('invoiceNo')
        .lean();

      if (lastInvoice?.invoiceNo) {
        const lastNumber = parseInt(lastInvoice.invoiceNo.split('/').pop());
        this.invoiceNo = `ENA/${lastNumber + 1}`;
      } else {
        this.invoiceNo = 'ENA/1234';
      }

      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Pre-save hook to filter out empty items
invoiceSchema.pre('save', function (next) {
  // Filter out items that are completely empty
  this.items = this.items.filter(item =>
    item.itemName || item.quantity > 0 || item.unitPrice > 0 || item.lineFit
  );
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;