const service = require("./notification.service");

exports.send = async (req, res, next) => {
  try {
    const { userId, type, message } = req.body;
    const notification = await service.sendNotification({
      userId,
      type,
      message
    });
    res.json(notification);
  } catch (e) {
    next(e);
  }
};
