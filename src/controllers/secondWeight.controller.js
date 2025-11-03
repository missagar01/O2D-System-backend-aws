// import {
//   getPendingSecondWeight,
//   getSecondWeightHistory,
// } from "../services/secondWeigh.service.js";

// export async function fetchPendingSecondWeight(req, res) {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 50;
//     const offset = (page - 1) * limit;

//     const data = await getPendingSecondWeight(offset, limit);
//     res.status(200).json({ success: true, data });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch pending second weight data",
//       error: error.message,
//     });
//   }
// }

// export async function fetchSecondWeightHistory(req, res) {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 50;
//     const offset = (page - 1) * limit;

//     const data = await getSecondWeightHistory(offset, limit);
//     res.status(200).json({ success: true, data });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch second weight history data",
//       error: error.message,
//     });
//   }
// }





import {
  getPendingSecondWeight,
  getSecondWeightHistory,
} from "../services/secondWeight.service.js";

export async function fetchPendingSecondWeight(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const data = await getPendingSecondWeight(offset, limit, customer, search);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending second weight data",
      error: error.message,
    });
  }
}

export async function fetchSecondWeightHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const customer = req.query.customer || '';
    const search = req.query.search || '';

    const data = await getSecondWeightHistory(offset, limit, customer, search);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch second weight history data",
      error: error.message,
    });
  }
}