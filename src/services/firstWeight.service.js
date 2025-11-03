// import { getConnection } from "../config/db.js";
// import oracledb from "oracledb";

// // 🟢 Pending
// export async function getPendingFirstWeight(offset = 0, limit = 50) {
//   const query = `
//     SELECT * FROM (
//       SELECT a.*, ROWNUM rnum FROM (
//         SELECT 
//           t.vrdate + INTERVAL '15' MINUTE AS planned_timestamp,
//           t.order_vrno,
//           t.vrno,
//           lhs_utility.get_name('acc_code', t.acc_code) AS party_name,
//           t.truckno,
//           t.driver_name,
//           t.driver_mobile,
//           t.driver_driving_license
//         FROM view_gatetran_engine t
//         WHERE t.entity_code = 'SR'
//           AND t.order_tcode = 'O'
//           AND (SELECT DISTINCT a.div_code 
//               FROM view_order_engine a WHERE a.vrno = t.order_vrno) = 'PM'
//           AND t.wslip_no IS NULL
//           AND t.vrdate >= TRUNC(SYSDATE)
//         ORDER BY t.vrdate + INTERVAL '15' MINUTE ASC
//       ) a
//       WHERE ROWNUM <= :endRow
//     )
//     WHERE rnum > :startRow
//   `;

//   const params = { startRow: offset, endRow: offset + limit };
//   let connection;
//   try {
//     connection = await getConnection();
//     const result = await connection.execute(query, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
//     return result.rows;
//   } finally {
//     if (connection) await connection.close();
//   }
// }

// export async function getFirstWeightHistory(offset = 0, limit = 50) {
//   const query = `
//     SELECT * FROM (
//       SELECT a.*, ROWNUM rnum FROM (
//         SELECT DISTINCT
//           t.vrdate + INTERVAL '15' MINUTE AS planned_timestamp,
//           (
//             SELECT MIN(a.indate)
//             FROM view_weighbridge_engine a
//             WHERE a.gate_vrno = t.vrno 
//               AND a.slno = 1
//           ) AS actual_timestamp,
//           t.order_vrno,
//           t.vrno,
//           t.wslip_no,
//           lhs_utility.get_name('acc_code', t.acc_code) AS party_name,
//           t.truckno,
//           t.driver_name,
//           t.driver_mobile,
//           t.driver_driving_license
//         FROM view_gatetran_engine t
//         WHERE t.entity_code = 'SR'
//           AND t.wslip_no IS NOT NULL
//           AND (
//             SELECT MIN(a.div_code)
//             FROM view_weighbridge_engine a 
//             WHERE a.gate_vrno = t.vrno 
//               AND a.slno = 1
//           ) = 'PM'
//           AND SUBSTR(t.vrno, 1, 2) = 'SE'
//           AND t.vrdate >= TO_DATE('01-APR-2025', 'DD-MON-YYYY')
//         ORDER BY t.vrdate + INTERVAL '15' MINUTE ASC
//       ) a
//       WHERE ROWNUM <= :endRow
//     )
//     WHERE rnum > :startRow
//   `;

//   const params = { startRow: offset, endRow: offset + limit };
//   let connection;

//   try {
//     connection = await getConnection();
//     const result = await connection.execute(query, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
//     return result.rows;
//   } catch (error) {
//     console.error("Error fetching all first weight history:", error);
//     throw error;
//   } finally {
//     if (connection) await connection.close();
//   }
// }





import { getConnection } from "../config/db.js";
import oracledb from "oracledb";

// 🟢 Pending with Filters
export async function getPendingFirstWeight(offset = 0, limit = 50, customer = '', search = '') {
  let baseQuery = `
    SELECT * FROM (
      SELECT a.*, ROWNUM rnum FROM (
        SELECT 
          t.vrdate + INTERVAL '15' MINUTE AS planned_timestamp,
          t.order_vrno,
          t.vrno,
          lhs_utility.get_name('acc_code', t.acc_code) AS party_name,
          t.truckno,
          t.driver_name,
          t.driver_mobile,
          t.driver_driving_license
        FROM view_gatetran_engine t
        WHERE t.entity_code = 'SR'
          AND t.order_tcode = 'O'
          AND (SELECT DISTINCT a.div_code 
              FROM view_order_engine a WHERE a.vrno = t.order_vrno) = 'PM'
          AND t.wslip_no IS NULL
          AND t.vrdate >= TRUNC(SYSDATE)
  `;

  // Add customer filter
  if (customer) {
    baseQuery += ` AND UPPER(lhs_utility.get_name('acc_code', t.acc_code)) LIKE UPPER('%${customer.replace(/'/g, "''")}%')`;
  }

  // Add search filter
  if (search) {
    baseQuery += ` AND (
      UPPER(t.order_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(lhs_utility.get_name('acc_code', t.acc_code)) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.truckno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.driver_name) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.driver_mobile) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.driver_driving_license) LIKE UPPER('%${search.replace(/'/g, "''")}%')
    )`;
  }

  baseQuery += `
        ORDER BY t.vrdate + INTERVAL '15' MINUTE ASC
      ) a
      WHERE ROWNUM <= :endRow
    )
    WHERE rnum > :startRow
  `;

  const params = { startRow: offset, endRow: offset + limit };
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(baseQuery, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return result.rows;
  } finally {
    if (connection) await connection.close();
  }
}

// 🟣 History with Filters
export async function getFirstWeightHistory(offset = 0, limit = 50, customer = '', search = '') {
  let baseQuery = `
    SELECT * FROM (
      SELECT a.*, ROWNUM rnum FROM (
        SELECT DISTINCT
          t.vrdate + INTERVAL '15' MINUTE AS planned_timestamp,
          (
            SELECT MIN(a.indate)
            FROM view_weighbridge_engine a
            WHERE a.gate_vrno = t.vrno 
              AND a.slno = 1
          ) AS actual_timestamp,
          t.order_vrno,
          t.vrno,
          t.wslip_no,
          lhs_utility.get_name('acc_code', t.acc_code) AS party_name,
          t.truckno,
          t.driver_name,
          t.driver_mobile,
          t.driver_driving_license
        FROM view_gatetran_engine t
        WHERE t.entity_code = 'SR'
          AND t.wslip_no IS NOT NULL
          AND (
            SELECT MIN(a.div_code)
            FROM view_weighbridge_engine a 
            WHERE a.gate_vrno = t.vrno 
              AND a.slno = 1
          ) = 'PM'
          AND SUBSTR(t.vrno, 1, 2) = 'SE'
          AND t.vrdate >= TO_DATE('01-APR-2025', 'DD-MON-YYYY')
  `;

  // Add customer filter
  if (customer) {
    baseQuery += ` AND UPPER(lhs_utility.get_name('acc_code', t.acc_code)) LIKE UPPER('%${customer.replace(/'/g, "''")}%')`;
  }

  // Add search filter
  if (search) {
    baseQuery += ` AND (
      UPPER(t.order_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(lhs_utility.get_name('acc_code', t.acc_code)) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.truckno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.driver_name) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.driver_mobile) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.driver_driving_license) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.wslip_no) LIKE UPPER('%${search.replace(/'/g, "''")}%')
    )`;
  }

  baseQuery += `
        ORDER BY t.vrdate + INTERVAL '15' MINUTE ASC
      ) a
      WHERE ROWNUM <= :endRow
    )
    WHERE rnum > :startRow
  `;

  const params = { startRow: offset, endRow: offset + limit };
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.execute(baseQuery, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return result.rows;
  } catch (error) {
    console.error("Error fetching all first weight history:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}