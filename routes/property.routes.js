// const express = require("express");
// const router = express.Router();
// const properties = require("../controllers/property.controller");

// // Read properties
// router.get("/", properties.findAll);

// // Create property
// router.post("/", properties.create);

// module.exports = router;

module.exports = (app) => {
  const properties = require("../controllers/property.controller");
  const router = require("express").Router();
  // Create a new Tutorial
  router.post("/", properties.create);
  // Retrieve all Tutorials
  router.get("/", properties.findAll);
  // Retrieve all published Tutorials
  router.get("/published", properties.findAllPublished);
  // Retrieve a single Tutorial with id
  router.get("/:id", properties.findOne);
  // Update a Tutorial with id
  router.put("/:id", properties.update);
  // Delete a Tutorial with id
  router.delete("/:id", properties.delete);
  // Create a new Tutorial
  router.delete("/", properties.deleteAll);

  app.use("/api/properties", router);
};
