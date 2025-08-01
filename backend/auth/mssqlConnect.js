require("dotenv").config();
const sql = require("mssql");

const config = {
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASS,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const getPatientByUHID = async (uhid) => {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT TOP 1
        p.cPat_Name AS name,
        d.cDept_Name AS department
      FROM Mast_Patient p
      LEFT JOIN Mast_IP_Admission ip ON p.iPat_id = ip.iPat_id
      LEFT JOIN Mast_Dept d ON ip.iDept_id = d.iDept_id
      WHERE p.iReg_No = ${uhid}
    `;

    const data = result.recordset[0];

    if (!data) return null;

    return {
      name: data.name,
      department: data.department || "Unknown",
    };
  } catch (err) {
    console.error("MSSQL Error:", err.message);
    return null;
  }
};

module.exports = { getPatientByUHID };
