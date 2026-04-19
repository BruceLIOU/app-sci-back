import type { Application } from "express";
const controller = require("../controllers/maintenance.controller");

module.exports = (app: Application) => {
	app.get("/api/maintenance", controller.findAll);
	app.get("/api/maintenance/:id", controller.findOne);
	app.post("/api/maintenance", controller.create);
	app.put("/api/maintenance/:id", controller.update);
	app.delete("/api/maintenance/:id", controller.delete);
};
