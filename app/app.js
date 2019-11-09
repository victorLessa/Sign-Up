const express = require('express')
const cors = require('cors')
const routes = require('./routes')
const authAutenticate = require('./middleware/auth-middleware')
const errorHandler = require('./middleware/errorHandler-middleware')

class App {
  constructor() {
    this.express = express()
    this.middlewares()
    this.routes()
    this.express.use(errorHandler)
  }
  middlewares() {
    this.express.use(cors())
    this.express.use(authAutenticate)
    this.express.use(express.json())
  }
  routes() {
    routes(this.express)
  }
}

module.exports = new App().express
