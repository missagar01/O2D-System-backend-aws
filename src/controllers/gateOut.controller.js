import { getPendingGateOutData, getGateOutHistoryData, getAllGateOutCustomers } from "../services/gateOut.service.js";

// 🟢 Pending Gate Out
export async function fetchPendingGateOut(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const data = await getPendingGateOutData(offset, limit, customer, search);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending gate out data",
      error: error.message,
    });
  }
}

// 🟣 Gate Out History
export async function fetchGateOutHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const data = await getGateOutHistoryData(offset, limit, customer, search);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch gate out history data",
      error: error.message,
    });
  }
}


export async function fetchAllGateOutCustomers(req, res) {
  try {
    const customers = await getAllGateOutCustomers();
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
}

