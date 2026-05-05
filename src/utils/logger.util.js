const timestamp = () => new Date().toISOString();
const info = (msg) => console.log(`[INFO] ${timestamp()} - ${msg}`);
const warn = (msg) => console.warn(`[WARN] ${timestamp()} - ${msg}`);
const error = (msg) => console.error(`[ERROR] ${timestamp()} - ${msg}`);
module.exports = { info, warn, error };
