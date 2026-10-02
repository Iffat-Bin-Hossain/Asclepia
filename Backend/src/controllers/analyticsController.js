const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

/**
 * @desc  Get dashboard analytics using MongoDB aggregation pipelines
 * @route GET /api/analytics/dashboard
 * @access Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalDoctors,
      totalPatients,
      conditionStats,
      genderStats,
      patientsPerDoctor,
      last7DaysPatients,
      last7DaysDoctors,
      recentPatients,
      recentDoctors,
    ] = await Promise.all([
      // Total counts
      Doctor.countDocuments(),
      Patient.countDocuments(),

      // Patients grouped by condition
      Patient.aggregate([
        { $group: { _id: '$condition', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { condition: '$_id', count: 1, _id: 0 } },
      ]),

      // Patients grouped by gender
      Patient.aggregate([
        { $group: { _id: '$gender', count: { $sum: 1 } } },
        { $project: { gender: '$_id', count: 1, _id: 0 } },
      ]),

      // Top 5 doctors by patient count
      Doctor.aggregate([
        {
          $lookup: {
            from: 'patients',
            localField: '_id',
            foreignField: 'assignedDoctor',
            as: 'patientList',
          },
        },
        {
          $project: {
            name: 1,
            specialization: 1,
            hospital: 1,
            patientCount: { $size: '$patientList' },
          },
        },
        { $sort: { patientCount: -1 } },
        { $limit: 10 },
      ]),

      // New patients per day - last 7 days
      Patient.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),

      // New doctors per day - last 7 days
      Doctor.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),

      // Recent 5 patients
      Patient.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('assignedDoctor', 'name specialization')
        .select('name age gender condition createdAt assignedDoctor')
        .lean(),

      // Recent 5 doctors
      Doctor.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name specialization hospital createdAt')
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: { totalDoctors, totalPatients },
        conditionStats,
        genderStats,
        patientsPerDoctor,
        trends: {
          last7DaysPatients,
          last7DaysDoctors,
        },
        recent: {
          patients: recentPatients,
          doctors: recentDoctors,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc  Get monthly stats for a given year
 * @route GET /api/analytics/monthly
 * @access Private
 */
const getMonthlyStats = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const [monthlyPatients, monthlyDoctors] = await Promise.all([
      Patient.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31T23:59:59`),
            },
          },
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { month: '$_id', count: 1, _id: 0 } },
      ]),

      Doctor.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31T23:59:59`),
            },
          },
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { month: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: { year, monthlyPatients, monthlyDoctors },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getMonthlyStats };
