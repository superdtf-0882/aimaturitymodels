// Software Engineering's page, derived from the practice's rows (OKF-TOGAF#241). No model text is
// written here: lib/functionModels/fromRows.js derives the page from rows.json.
const { pageFor } = require("./fromRows");

const softwareEngineeringFunctionModel = pageFor("FM-MODEL-SE");

module.exports = { softwareEngineeringFunctionModel };
