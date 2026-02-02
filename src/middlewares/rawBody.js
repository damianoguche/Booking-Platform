module.exports = (req, res, buf) => {
  req.rawBody = buf.toString();
};

// payment gateways require raw request body for signature
// verification.
