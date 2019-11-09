const express = require('express')
const router = express.Router()
let UserController = require('../controller/UserController')
UserController = new UserController()

router.post('/signUp', (req, res, next) => UserController.store(req, res, next))
router.post('/signIn', (req, res, next) =>
  UserController.authenticate(req, res, next)
)

module.exports = router
