const errorHandler = (err, req, res, next) => {
  console.log(err)
  res.status(500).send({
    message: err.message,
    stack: err.stack,
    status: 500,
  })
}

module.exports = errorHandler
