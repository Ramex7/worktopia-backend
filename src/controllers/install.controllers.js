// import the install service to handel communication with the database 
const installService = require('../services/install.services');
// create a function to handel the install request 
const install = async (req, res) => {
    // call the install service to create the database tables
    const installMessage = await installService.install();
    // check if the install was successful or not and send tha appropriate message  to the client
    if (installMessage) {
        res.status(200).json({ message: installMessage });
    } else {
        res.status(500).json({ message: installMessage });
    }
}
// export the install function 
module.exports = { install };