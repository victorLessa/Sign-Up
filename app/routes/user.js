const express = require('express')
const router = express.Router()
const moment = require('moment-timezone')
let UserController = require('../controller/UserController')
UserController = new UserController(moment)
const { sign_up_validate, sign_in_validate } = require('../validation/index')

router.post('/signUp', sign_up_validate, (req, res, next) =>
  UserController.store(req, res, next)
)
router.post('/signIn', sign_in_validate, (req, res, next) =>
  UserController.authenticate(req, res, next)
)

router.get('/user/:user_id', (req, res, next) => {
  UserController.getUser(req, res, next)
})

module.exports = router
