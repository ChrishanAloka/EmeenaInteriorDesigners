import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true
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

const quotationSchema = new mongoose.Schema({
  quotationNo: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  validTill: {
    type: Date,
    required: true
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
  clientName: {
    type: String,
    required: true,
    trim: true
  },
  clientTitle: {
    type: String,
    enum: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'],
    default: 'Mr.'
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
    type: [quotationItemSchema],
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
    enum: ['draft', 'pending', 'approved', 'rejected', 'completed'],
    default: 'draft'
  },
  projectSchedule: {
    measuringDay: Date,
    inspection: Date,
    installation1: Date,
    installation2: Date,
    completionDate: Date
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

quotationSchema.pre('validate', async function (next) {
  if (this.isNew && !this.quotationNo) {
    try {
      const lastQuotation = await this.constructor
        .findOne()
        .sort({ createdAt: -1 })
        .select('quotationNo')
        .lean();

      if (lastQuotation?.quotationNo) {
        const lastNumber = parseInt(lastQuotation.quotationNo.split('/').pop());
        this.quotationNo = `QN26/A/${lastNumber + 1}`;
      } else {
        this.quotationNo = 'QN26/A/1234';
      }

      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});


const Quotation = mongoose.model('Quotation', quotationSchema);

export default Quotation;