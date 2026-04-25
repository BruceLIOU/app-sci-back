import type { Application } from "express";

const controller = require("../controllers/tenant-portal.controller");

module.exports = (app: Application) => {
	app.get("/api/tenant-portal/dashboard", controller.getDashboard);
	app.get("/api/tenant-portal/payments", controller.getPayments);
	app.get("/api/tenant-portal/documents", controller.getDocuments);
	app.get("/api/tenant-portal/maintenance", controller.getMaintenance);
	app.post("/api/tenant-portal/maintenance", controller.createMaintenance);
};
