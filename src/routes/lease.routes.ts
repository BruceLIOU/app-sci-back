import type { Application } from "express";
import {
	leaseCreateSchema,
	leaseUpdateSchema,
} from "../validation/schemas/lease.schema";
import { validate } from "../validation/validate.middleware";
const controller = require("../controllers/lease.controller");

module.exports = (app: Application) => {
	app.get("/api/leases/irl", controller.getIrl);
	app.get("/api/leases", controller.findAll);
	app.get("/api/leases/:id", controller.findOne);
	app.post("/api/leases", validate(leaseCreateSchema), controller.create);
	app.put("/api/leases/:id", validate(leaseUpdateSchema), controller.update);
	app.delete("/api/leases/:id", controller.delete);
	app.get("/api/leases/:lease_id/irl-simulate", controller.simulateIrl);
	app.post("/api/leases/:lease_id/irl-apply", controller.applyIrl);
	app.post("/api/leases/:lease_id/renew", controller.renew);
	app.post("/api/leases/:lease_id/terminate", controller.terminate);
};
