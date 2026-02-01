const service = require("./property.service");

exports.create = async (req, res, next) => {
  try {
    const property = await service.createProperty(req.body, req.user.id);
    res.status(201).json(property);
  } catch (e) {
    next(e);
  }
};

exports.myProperties = async (req, res, next) => {
  try {
    const properties = await service.getHostProperties(req.user.id);
    res.json(properties);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const property = await service.updateProperty(
      req.params.id,
      req.body,
      req.user.id
    );
    res.json(property);
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteProperty(req.params.id, req.user.id);
    res.json({ message: "Property deleted" });
  } catch (e) {
    next(e);
  }
};

exports.all = async (req, res, next) => {
  try {
    const properties = await service.getAllProperties();
    res.json(properties);
  } catch (e) {
    next(e);
  }
};
