import { getConnection } from "../config/db.js";
import oracledb from "oracledb";

// 🟢 Payment Pending Data with Filters
export async function getPendingPaymentData(offset = 0, limit = 50, customer = '', search = '') {
  let baseQuery = `
        SELECT 
          t.lastupdate + INTERVAL '7' DAY AS planned_timestamp,
          t.vrdate,
          t.order_vrno,
          t.gate_vrno,
          t.vrno,
          lhs_utility.get_name('acc_code', t.acc_code) AS customer_name,
          t.truckno,
          CASE 
            WHEN SUBSTR(t.item_code,1,3) = 'F03' THEN 'MS PIPE'
            WHEN SUBSTR(t.item_code,1,3) = 'F02' THEN 'MS STRIP'
            WHEN SUBSTR(t.item_code,1,3) = 'F01' THEN 'MS BILLET'
            ELSE NULL 
          END AS item_name,
          SUM(t.qtyissued) AS qty,
          SUM(t.dramt) AS total_amount,
          (SELECT SUM(a.alloc_amt) FROM alloc_tran a WHERE a.dr_vrno = t.vrno) AS received_amount,
          (SUM(t.dramt) - (SELECT SUM(a.alloc_amt) FROM alloc_tran a WHERE a.dr_vrno = t.vrno)) AS balance_amount,
          (TO_DATE(TRUNC(SYSDATE),'DD-MM-YYYY') - TO_DATE(t.vrdate,'DD-MM-YYYY')) AS days
        FROM view_itemtran_engine t
        WHERE t.entity_code = 'SR'
          AND t.series = 'SA'
          AND t.acc_code NOT IN ('4CA01','ZGA01', 'ZGA02', 'ZMA01', 'ZPA01', 'ZSH01', 'ZSO01', 'ZSO02', 'ZSO03', 'ZSO04','4AL01','1GA18')
          AND t.receipt_vrdate IS NULL
          AND (SELECT SUM(a.alloc_amt) FROM alloc_tran a WHERE a.dr_vrno = t.vrno) < t.dramt
          AND SUBSTR(t.item_code,1,3) IN ('F01','F02','F03')
          AND t.vrdate >= TO_DATE('01-APR-2025', 'DD-MON-YYYY')
  `;

  // ✅ Filter by customer
  if (customer) {
    baseQuery += ` AND UPPER(lhs_utility.get_name('acc_code', t.acc_code)) LIKE UPPER('%${customer.replace(/'/g, "''")}%')`;
  }

  // ✅ Filter by search term
  if (search) {
    baseQuery += ` AND (
      UPPER(t.vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.order_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.gate_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.truckno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(lhs_utility.get_name('acc_code', t.acc_code)) LIKE UPPER('%${search.replace(/'/g, "''")}%')
    )`;
  }

  baseQuery += `
        GROUP BY t.lastupdate, t.order_vrno, t.gate_vrno, t.vrno, t.truckno,
                 SUBSTR(t.item_code,1,3), t.acc_code, t.div_code, t.vrdate
        ORDER BY t.lastupdate ASC
  `;

  const params = {};
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.execute(baseQuery, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return result.rows;
  } catch (error) {
    console.error("Error fetching pending payment data:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// 🟣 Payment History Data with Filters
export async function getPaymentHistoryData(offset = 0, limit = 50, customer = '', search = '') {
  const baseFilters = [
    "t.entity_code = 'SR'",
    "t.series = 'SA'",
    "t.acc_code NOT IN ('4CA01','ZGA01', 'ZGA02', 'ZMA01', 'ZPA01', 'ZSH01', 'ZSO01', 'ZSO02', 'ZSO03', 'ZSO04','4AL01','1GA18')",
    "t.receipt_vrdate IS NOT NULL",
    "(SELECT SUM(a.alloc_amt) FROM alloc_tran a WHERE a.dr_vrno = t.vrno) = t.dramt",
    "SUBSTR(t.item_code,1,3) IN ('F01','F02','F03')",
    "t.vrdate >= TO_DATE('01-APR-2025', 'DD-MON-YYYY')"
  ];

  if (customer) {
    const sanitizedCustomer = customer.replace(/'/g, "''");
    baseFilters.push(`UPPER(lhs_utility.get_name('acc_code', t.acc_code)) LIKE UPPER('%${sanitizedCustomer}%')`);
  }

  if (search) {
    const sanitizedSearch = search.replace(/'/g, "''");
    baseFilters.push(`(
      UPPER(t.vrno) LIKE UPPER('%${sanitizedSearch}%') OR
      UPPER(t.order_vrno) LIKE UPPER('%${sanitizedSearch}%') OR
      UPPER(t.gate_vrno) LIKE UPPER('%${sanitizedSearch}%') OR
      UPPER(t.truckno) LIKE UPPER('%${sanitizedSearch}%') OR
      UPPER(lhs_utility.get_name('acc_code', t.acc_code)) LIKE UPPER('%${sanitizedSearch}%')
    )`);
  }

  const innerQuery = `
        SELECT 
          t.lastupdate + INTERVAL '7' DAY AS planned_timestamp,
          t.vrdate,
          t.order_vrno,
          t.gate_vrno,
          t.vrno,
          lhs_utility.get_name('acc_code', t.acc_code) AS customer_name,
          t.truckno,
          CASE 
            WHEN SUBSTR(t.item_code,1,3) = 'F03' THEN 'MS PIPE'
            WHEN SUBSTR(t.item_code,1,3) = 'F02' THEN 'MS STRIP'
            WHEN SUBSTR(t.item_code,1,3) = 'F01' THEN 'MS BILLET'
            ELSE NULL 
          END AS item_name,
          SUM(t.qtyissued) AS qty,
          SUM(t.dramt) AS total_amount,
          (SELECT SUM(a.alloc_amt) FROM alloc_tran a WHERE a.dr_vrno = t.vrno) AS received_amount,
          (SUM(t.dramt) - (SELECT SUM(a.alloc_amt) FROM alloc_tran a WHERE a.dr_vrno = t.vrno)) AS balance_amount
        FROM view_itemtran_engine t
        WHERE ${baseFilters.join("\n          AND ")}
        GROUP BY t.lastupdate, t.order_vrno, t.gate_vrno, t.vrno, t.truckno,
                 SUBSTR(t.item_code,1,3), t.acc_code, t.div_code, t.vrdate
        ORDER BY t.lastupdate ASC
  `;

  const baseQuery = innerQuery;
  const params = {};
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.execute(baseQuery, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return result.rows;
  } catch (error) {
    console.error("Error fetching payment history data:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// 🟩 Get all unique customers for payment section
export async function getAllPaymentCustomers() {
  const query = `
    SELECT DISTINCT lhs_utility.get_name('acc_code', acc_code) AS customer_name
    FROM view_itemtran_engine 
    WHERE entity_code = 'SR'
      AND lhs_utility.get_name('acc_code', acc_code) IS NOT NULL
    ORDER BY customer_name
  `;
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(query, {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return result.rows.map(row => row.CUSTOMER_NAME).filter(name => !!name);
  } catch (error) {
    console.error("Error fetching payment customers:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}
