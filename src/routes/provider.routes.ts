import type { Application } from "express";
const controller = require("../controllers/provider.controller");

module.exports = (app: Application) => {
	app.get("/api/providers", controller.findAll);
	app.get("/api/providers/:id", controller.findOne);
	app.post("/api/providers", controller.create);
	app.put("/api/providers/:id", controller.update);
	app.delete("/api/providers/:id", controller.delete);
};
