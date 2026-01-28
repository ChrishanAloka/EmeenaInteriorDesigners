import Quotation from '../models/Quotation.js';

// Create new quotation
export const createQuotation = async (req, res) => {
  try {
    const quotationData = {
      ...req.body,
      preparedBy: req.user._id,
      preparedByName: req.user.fullName
    };

    const quotation = new Quotation(quotationData);
    await quotation.save();

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quotation',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all quotations with filters
export const getAllQuotations = async (req, res) => {
  try {
    const { status, startDate, endDate, clientName, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (clientName) {
      filter.clientName = { $regex: clientName, $options: 'i' };
    }

    // Non-admin users can only see their own quotations
    if (req.user.role !== 'admin') {
      filter.preparedBy = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const quotations = await Quotation.find(filter)
      .populate('preparedBy', 'fullName staffId email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Quotation.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        quotations,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotations',
      error: error.message
    });
  }
};

// Get single quotation by ID
export const getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('preparedBy', 'fullName staffId email');

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Check permission
    if (req.user.role !== 'admin' && quotation.preparedBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quotation',
      error: error.message
    });
  }
};

// Update quotation
export const updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Check permission
    if (req.user.role !== 'admin' && quotation.preparedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'quotationNo' && key !== 'preparedBy') {
        quotation[key] = req.body[key];
      }
    });

    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation updated successfully',
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update quotation',
      error: error.message
    });
  }
};

// Delete quotation
export const deleteQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    // Check permission
    if (req.user.role !== 'admin' && quotation.preparedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Quotation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Quotation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete quotation',
      error: error.message
    });
  }
};

// Update quotation status
export const updateQuotationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const quotation = await Quotation.findById(req.params.id);

    if (!quotation) {
      return res.status(404).json({
        success: false,
        message: 'Quotation not found'
      });
    }

    quotation.status = status;
    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation status updated successfully',
      data: quotation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// Get quotation statistics
export const getQuotationStats = async (req, res) => {
  try {
    const filter = req.user.role !== 'admin' ? { preparedBy: req.user._id } : {};

    const stats = await Quotation.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$grandTotal' }
        }
      }
    ]);

    const totalQuotations = await Quotation.countDocuments(filter);
    const totalRevenue = await Quotation.aggregate([
      { $match: { ...filter, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalQuotations,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};