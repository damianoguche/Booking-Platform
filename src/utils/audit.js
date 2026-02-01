const rfs = require("rotating-file-stream");
const path = require("path");
const fs = require("fs");

// Ensure audit folder exists
const auditFolder = path.join(__dirname, "../../audit");

if (!fs.existsSync(auditFolder)) fs.mkdirSync(auditFolder);

// Create a daily rotating stream
const stream = rfs.createStream("audit.log", {
  interval: "1d", // rotate daily
  path: auditFolder,
  compress: "gzip", // compress old logs
  maxFiles: 90 // Keep last 90 days of logs
});

/**
 * Writes an audit entry to rotating audit log
 * @param {String} userId - ID of user performing the action
 * @param {String} action - Action description
 * @param {String} module - Module name (booking/payment/etc)
 * @param {Object} details - Optional extra info
 */
function log(userId, action, module, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    userId: userId || "SYSTEM",
    module,
    action,
    details
  };
  stream.write(JSON.stringify(entry) + "\n");
}

module.exports = { log };

// const fs = require("fs");
// const path = require("path");

// const auditFile = path.join(__dirname, "../../audit/audit.log");

// /**
//  * Writes an audit entry to audit.log
//  * @param {String} userId - ID of user performing the action
//  * @param {String} action - Action description
//  * @param {String} module - Module name (booking/payment/etc)
//  * @param {Object} details - Optional extra info
//  */
// function log(userId, action, module, details = {}) {
//   const entry = {
//     timestamp: new Date().toISOString(),
//     userId: userId || "SYSTEM",
//     module,
//     action,
//     details
//   };
//   fs.appendFileSync(auditFile, JSON.stringify(entry) + "\n");
// }

// module.exports = { log };
