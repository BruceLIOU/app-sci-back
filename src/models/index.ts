import { Sequelize } from 'sequelize'

const dbConfig = require('../config/db.config')

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
})

const db: Record<string, any> = {}
db.Sequelize = Sequelize
db.sequelize = sequelize
db.Property = require('./property.model')(sequelize, Sequelize)
db.Tenant = require('./tenant.model')(sequelize, Sequelize)
db.Payment = require('./payment.model')(sequelize, Sequelize)
db.Lease = require('./lease.model')(sequelize, Sequelize)
db.Charge = require('./charge.model')(sequelize, Sequelize)
db.Quittance = require('./quittance.model')(sequelize, Sequelize)
db.Inspection = require('./inspection.model')(sequelize, Sequelize)
db.Associate = require('./associate.model')(sequelize, Sequelize)
db.Document = require('./document.model')(sequelize, Sequelize)
db.SciConfig = require('./sci_config.model')(sequelize, Sequelize)
db.Visit = require('./visit.model')(sequelize, Sequelize)
db.User = require('./user.model')(sequelize, Sequelize)

// Property associations
db.Property.hasMany(db.Tenant, { foreignKey: 'property_id', onDelete: 'CASCADE' })
db.Tenant.belongsTo(db.Property, { foreignKey: 'property_id' })

db.Property.hasMany(db.Payment, { foreignKey: 'property_id', onDelete: 'CASCADE' })
db.Payment.belongsTo(db.Property, { foreignKey: 'property_id' })

db.Tenant.hasMany(db.Payment, { foreignKey: 'tenant_id', onDelete: 'CASCADE' })
db.Payment.belongsTo(db.Tenant, { foreignKey: 'tenant_id' })

// Lease associations
db.Property.hasMany(db.Lease, { foreignKey: 'property_id', onDelete: 'CASCADE' })
db.Lease.belongsTo(db.Property, { foreignKey: 'property_id' })
db.Tenant.hasMany(db.Lease, { foreignKey: 'tenant_id', onDelete: 'CASCADE' })
db.Lease.belongsTo(db.Tenant, { foreignKey: 'tenant_id' })

// Lease ↔ Payment associations
db.Lease.hasMany(db.Payment, { foreignKey: 'lease_id', onDelete: 'CASCADE' })
db.Payment.belongsTo(db.Lease, { foreignKey: 'lease_id' })

// Charge associations
db.Property.hasMany(db.Charge, { foreignKey: 'property_id', onDelete: 'CASCADE' })
db.Charge.belongsTo(db.Property, { foreignKey: 'property_id' })

// Quittance associations
db.Quittance.belongsTo(db.Tenant, { foreignKey: 'tenant_id' })
db.Tenant.hasMany(db.Quittance, { foreignKey: 'tenant_id' })
db.Quittance.belongsTo(db.Property, { foreignKey: 'property_id' })
db.Property.hasMany(db.Quittance, { foreignKey: 'property_id' })
db.Quittance.belongsTo(db.Lease, { foreignKey: 'lease_id' })
db.Lease.hasMany(db.Quittance, { foreignKey: 'lease_id' })
db.Quittance.belongsTo(db.Payment, { foreignKey: 'payment_id' })
db.Payment.hasOne(db.Quittance, { foreignKey: 'payment_id' })

// Inspection associations
db.Property.hasMany(db.Inspection, { foreignKey: 'property_id', onDelete: 'CASCADE' })
db.Inspection.belongsTo(db.Property, { foreignKey: 'property_id' })
db.Tenant.hasMany(db.Inspection, { foreignKey: 'tenant_id' })
db.Inspection.belongsTo(db.Tenant, { foreignKey: 'tenant_id' })
db.Lease.hasMany(db.Inspection, { foreignKey: 'lease_id' })
db.Inspection.belongsTo(db.Lease, { foreignKey: 'lease_id' })

// Visit associations
db.Property.hasMany(db.Visit, { foreignKey: 'property_id', onDelete: 'CASCADE' })
db.Visit.belongsTo(db.Property, { foreignKey: 'property_id' })
db.Tenant.hasMany(db.Visit, { foreignKey: 'tenant_id' })
db.Visit.belongsTo(db.Tenant, { foreignKey: 'tenant_id' })

module.exports = db
