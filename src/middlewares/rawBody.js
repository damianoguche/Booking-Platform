module.exports = (req, res, buf) => {
  req.body = buf;
};

// payment gateways require raw request body for signature
// verification.
