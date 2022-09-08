const db = require("../models");
const Property = db.Property;
const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  if (!req.fields.city) {
    res.status(400).send({
      message: "City can not be empty!",
    });
    return;
  }

  const property = {
    address: req.fields.address,
    zipcode: req.fields.zipcode,
    city: req.fields.city,
    type: req.fields.type,
    pieces: req.fields.pieces,
    area: req.fields.area,
  };

  try {
    const result = await Property.create(property);

    if (result) {
      res.status(201).json(result);
    } else {
      res.status(500).json({
        message: `Cannot create Property. Maybe Property req.fields is empty!`,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Error creating Property.",
    });
  }
};

exports.findAll = async (req, res) => {
  await Property.findAll()
    .then((data) => {
      res.status(201).json(data);
    })
    .catch((err) => {
      res.status(500).json({
        message:
          err.message || "Some error occurred while retrieving tutorials.",
      });
    });
};
// Find a single Property with an id
exports.findOne = (req, res) => {};
// Update a Property by the id in the request
exports.update = async (req, res) => {
  const { address, zipcode, city, type, pieces, area } = req.fields;
  const { thumbnail, images } = req.files;
  const id = req.params.id;
  try {
    const result = await Property.update(
      { address, zipcode, city, type, pieces, area, thumbnail, images },
      {
        where: { id: id },
      }
    );
    if (result.length > 0) {
      res.status(201).json({
        message: "Property was updated successfully.",
      });
    } else {
      res.status(500).json({
        message: `Cannot update Property with id=${id}. Maybe Property was not found or req.fields is empty!`,
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Error updating Property with id=" + id,
    });
  }
};
// Delete a Property with the specified id in the request
exports.delete = async (req, res) => {
  const id = req.params.id;
  await Property.destroy({
    where: { id: id },
  })
    .then((num) => {
      if (num == 1) {
        res.status(201).json({
          message: "Property was deleted successfully!",
          isDeleted: true,
        });
      } else {
        res.status(500).json({
          message: `Cannot delete Property with id=${id}. Maybe Property was not found!`,
          isDeleted: false,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Could not delete Property with id=" + id,
      });
    });
};
// Delete all Propertys from the database.
exports.deleteAll = (req, res) => {};
// Find all published Propertys
exports.findAllPublished = (req, res) => {};
