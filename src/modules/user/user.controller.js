const service = require("./user.service");

exports.register = async (req, res, next) => {
  try {
    const user = await service.register(req.body);
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
};

exports.login = async (req, res, next) => {
  try {
    const token = await service.login(req.body);
    res.json(token);
  } catch (e) {
    next(e);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await service.getAllUsers();
    res.json(users);
  } catch (e) {
    next(e);
  }
};

exports.changeRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await service.updateRole(req.params.id, role);
    res.json(user);
  } catch (e) {
    next(e);
  }
};
