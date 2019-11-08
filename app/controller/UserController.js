'user strict'
const { sequelize, User, Phone } = require('../models/index')
require('dotenv').config()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

class UserController {
  async generateToken(user_id) {
    const token = jwt.sign({ id: user_id }, process.env.SECRET, {
      expiresIn: process.env.EXPIRES_IN,
    })
    return token
  }
  async store(req, res, next) {
    try {
      let { nome, email, senha, telefones } = req.body

      let user = await User.findOne({
        where: { email },
      })

      if (user) {
        return res.status(401).send({ message: 'E-mail já existente' })
      }

      senha = await bcrypt.hash(senha, 10)

      user = await sequelize.transaction().then(t => {
        return User.create(
          {
            nome,
            email,
            senha,
            ultimo_login: new Date(),
          },
          { transaction: t }
        )
          .then(user => {
            for (let statement of telefones) {
              return Phone.create(
                {
                  user_id: user.id,
                  numero: statement.numero,
                  ddd: statement.ddd,
                },
                { transaction: t }
              )
            }
          })
          .then(async () => {
            await t.commit()
            return await User.findOne({
              where: { email },
              attributes: [
                'id',
                ['created_at', 'data_criacao'],
                ['updated_at', 'data_atualizacao'],
                'ultimo_login',
              ],
            })
          })
          .catch(err => {
            t.rollback()
            throw new Error(err)
          })
      })

      const token = await this.generateToken(user.id)

      user.dataValues.token = token

      return res.send(user.dataValues)
    } catch (err) {
      return next(err)
    }
  }
  async authenticate(req, res) {
    let { email, password } = req.body

    let user = await User.findOne({ where: { email } })

    if (!user) {
      return res.status(400).send({ message: 'Usuário e/ou senha inválidos' })
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).send({ message: 'Usuário e/ou senha inválidos' })
    }

    const token = await this.generateToken(user.id)
    console.log(user)
    res.send({ user, token })
  }
}

module.exports = UserController
