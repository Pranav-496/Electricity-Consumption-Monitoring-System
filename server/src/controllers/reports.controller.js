const db = require('../services/db.service');
const reportService = require('../services/report.service');
const csvService = require('../services/csv.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllReports = async (req, res, next) => {
  try {
    const reports = await db.getReports();
    return successResponse(res, reports);
  } catch (err) {
    next(err);
  }
};

const generateReport = async (req, res, next) => {
  try {
    const { report_type, filters, save } = req.body;
    if (!report_type) {
      return errorResponse(res, 'Report type is required', 400);
    }

    const effectiveFilters = { ...(filters || {}) };
    if (req.user && req.user.role === 'consumer') {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      if (myConsumers.length > 0) {
        effectiveFilters.consumer_id = myConsumers[0].id;
      }
    }

    const reportData = await reportService.generateReportData(report_type, effectiveFilters);

    // Save report in persistent records if requested
    if (save) {
      const saved = await db.saveReport({
        report_type,
        generated_by: req.user.id,
        filters: effectiveFilters,
        summary_data: reportData.summary
      });
      reportData.id = saved.id;
    }

    return successResponse(res, reportData, 'Report generated successfully');
  } catch (err) {
    next(err);
  }
};

const downloadReportCsv = async (req, res, next) => {
  try {
    const { report_type } = req.params;
    const filters = { ...(req.query || {}) };

    if (req.user && req.user.role === 'consumer') {
      const myConsumers = await db.getConsumers({ consumer_user_id: req.user.id });
      if (myConsumers.length > 0) {
        filters.consumer_id = myConsumers[0].id;
      }
    }

    const reportData = await reportService.generateReportData(report_type, filters);
    const csvContent = csvService.jsonToCsv(reportData.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${report_type}-report-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllReports,
  generateReport,
  downloadReportCsv
};
