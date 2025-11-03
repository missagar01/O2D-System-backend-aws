// import { getConnection } from "../config/db.js";
// import oracledb from "oracledb";

// // 🟢 Pending Second Weight
// export async function getPendingSecondWeight(offset = 0, limit = 50) {
//   const query = `
//     SELECT * FROM (
//       SELECT a.*, ROWNUM rnum FROM (
//         SELECT 
//           t.indate + INTERVAL '4' HOUR AS planned_timestamp,
//           t.indate,
//           t.order_vrno,
//           t.gate_vrno,
//           t.wslipno,
//           t.acc_remark,
//           t.truckno
//         FROM view_weighbridge_engine t
//         WHERE t.entity_code = 'SR'
//           AND t.tcode = 'S'
//           AND t.outdate IS NULL
//           AND t.div_code = 'PM'
//           AND t.vrdate >= TRUNC(SYSDATE)
//         ORDER BY t.indate ASC
//       ) a
//       WHERE ROWNUM <= :endRow
//     )
//     WHERE rnum > :startRow
//   `;

//   const params = { startRow: offset, endRow: offset + limit };
//   let connection;

//   try {
//     connection = await getConnection();
//     const result = await connection.execute(query, params, {
//       outFormat: oracledb.OUT_FORMAT_OBJECT,
//     });
//     return result.rows;
//   } catch (error) {
//     console.error("Error fetching pending second weight:", error);
//     throw error;
//   } finally {
//     if (connection) await connection.close();
//   }
// }

// // 🟣 Second Weight History
// export async function getSecondWeightHistory(offset = 0, limit = 50) {
//   const query = `
//     SELECT * FROM (
//       SELECT a.*, ROWNUM rnum FROM (
//         SELECT 
//           t.indate + INTERVAL '4' HOUR AS planned_timestamp,
//           t.outdate,
//           t.indate,
//           t.order_vrno,
//           t.gate_vrno,
//           t.wslipno,
//           t.acc_remark,
//           t.truckno
//         FROM view_weighbridge_engine t
//         WHERE t.entity_code = 'SR'
//           AND t.tcode = 'S'
//           AND t.outdate IS NOT NULL
//           AND t.div_code = 'PM'
//           AND t.vrdate >= TO_DATE('01-APR-2025', 'DD-MON-YYYY')
//         ORDER BY t.outdate ASC
//       ) a
//       WHERE ROWNUM <= :endRow
//     )
//     WHERE rnum > :startRow
//   `;

//   const params = { startRow: offset, endRow: offset + limit };
//   let connection;

//   try {
//     connection = await getConnection();
//     const result = await connection.execute(query, params, {
//       outFormat: oracledb.OUT_FORMAT_OBJECT,
//     });
//     return result.rows;
//   } catch (error) {
//     console.error("Error fetching second weight history:", error);
//     throw error;
//   } finally {
//     if (connection) await connection.close();
//   }
// }



import { getConnection } from "../config/db.js";
import oracledb from "oracledb";

// 🟢 Pending Second Weight with Filters
export async function getPendingSecondWeight(offset = 0, limit = 50, customer = '', search = '') {
  let baseQuery = `
    SELECT * FROM (
      SELECT a.*, ROWNUM rnum FROM (
        SELECT 
          t.indate + INTERVAL '4' HOUR AS planned_timestamp,
          t.indate,
          t.order_vrno,
          t.gate_vrno,
          t.wslipno,
          t.acc_remark,
          t.truckno
        FROM view_weighbridge_engine t
        WHERE t.entity_code = 'SR'
          AND t.tcode = 'S'
          AND t.outdate IS NULL
          AND t.div_code = 'PM'
          AND t.vrdate >= TRUNC(SYSDATE)
  `;

  // Add customer filter
  if (customer) {
    baseQuery += ` AND UPPER(t.acc_remark) LIKE UPPER('%${customer.replace(/'/g, "''")}%')`;
  }

  // Add search filter
  if (search) {
    baseQuery += ` AND (
      UPPER(t.order_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.gate_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.acc_remark) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.truckno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.wslipno) LIKE UPPER('%${search.replace(/'/g, "''")}%')
    )`;
  }

  baseQuery += `
        ORDER BY t.indate ASC
      ) a
      WHERE ROWNUM <= :endRow
    )
    WHERE rnum > :startRow
  `;

  const params = { startRow: offset, endRow: offset + limit };
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.execute(baseQuery, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return result.rows;
  } catch (error) {
    console.error("Error fetching pending second weight:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

// 🟣 Second Weight History with Filters
export async function getSecondWeightHistory(offset = 0, limit = 50, customer = '', search = '') {
  let baseQuery = `
    SELECT * FROM (
      SELECT a.*, ROWNUM rnum FROM (
        SELECT 
          t.indate + INTERVAL '4' HOUR AS planned_timestamp,
          t.outdate,
          t.indate,
          t.order_vrno,
          t.gate_vrno,
          t.wslipno,
          t.acc_remark,
          t.truckno
        FROM view_weighbridge_engine t
        WHERE t.entity_code = 'SR'
          AND t.tcode = 'S'
          AND t.outdate IS NOT NULL
          AND t.div_code = 'PM'
          AND t.vrdate >= TO_DATE('01-APR-2025', 'DD-MON-YYYY')
  `;

  // Add customer filter
  if (customer) {
    baseQuery += ` AND UPPER(t.acc_remark) LIKE UPPER('%${customer.replace(/'/g, "''")}%')`;
  }

  // Add search filter
  if (search) {
    baseQuery += ` AND (
      UPPER(t.order_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.gate_vrno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.acc_remark) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.truckno) LIKE UPPER('%${search.replace(/'/g, "''")}%') OR
      UPPER(t.wslipno) LIKE UPPER('%${search.replace(/'/g, "''")}%')
    )`;
  }

  baseQuery += `
        ORDER BY t.outdate ASC
      ) a
      WHERE ROWNUM <= :endRow
    )
    WHERE rnum > :startRow
  `;

  const params = { startRow: offset, endRow: offset + limit };
  let connection;

  try {
    connection = await getConnection();
    const result = await connection.execute(baseQuery, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    });
    return result.rows;
  } catch (error) {
    console.error("Error fetching second weight history:", error);
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}