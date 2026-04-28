// import the express module 
const express = require('express');
// call the router method from express to create the router
const router = express.Router();
// import the install controller 
const installController = require('../controllers/install.controllers');
// create a route to handel the install request on get 
router.get('/install', installController.install);
// Export the router 
module.exports = router;