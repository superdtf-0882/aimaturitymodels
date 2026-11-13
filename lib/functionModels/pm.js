// Product Management's page, derived from the practice's rows (OKF-TOGAF#241). No model text is
// written here: lib/functionModels/fromRows.js derives the page from rows.json.
const { pageFor } = require("./fromRows");

const pmFunctionModel = pageFor("FM-MODEL-PM");

module.exports = { pmFunctionModel };
