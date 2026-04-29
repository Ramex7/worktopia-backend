// import the install service to handel communication with the database
const installService = require("../services/install.services");

// create a function to handel the install request
const install = async (req, res) => {
  try {
    // call the install service to create the database tables
    const result = await installService.install();
    const status =
      Number.isInteger(result?.status) && result.status >= 100 && result.status <= 599
        ? result.status
        : 500;
    const message = result?.message || "Install failed";

    // send the appropriate message to the client
    res.status(status).json({ message });
  } catch (error) {
    res.status(500).json({ message: error.message || "Install failed" });
  }
};

// export the install function
module.exports = { install };
