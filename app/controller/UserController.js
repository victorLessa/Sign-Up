'user strict'
const { sequelize, User, Phone } = require('../models/index')
require('dotenv').config()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

class UserController {
  constructor(moment) {
    this.moment = moment
  }
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
  async authenticate(req, res, next) {
    try {
      let { email, senha } = req.body

      let user = await User.findOne({
        where: { email },
        attributes: [
          'id',
          'senha',
          ['created_at', 'data_criacao'],
          ['updated_at', 'data_atualizacao'],
          'ultimo_login',
        ],
      })

      if (!user) {
        return res.status(401).send({ message: 'Usuário e/ou senha inválidos' })
      }

      if (!(await bcrypt.compare(senha, user.senha))) {
        return res.status(401).send({ message: 'Usuário e/ou senha inválidos' })
      }

      const token = await this.generateToken(user.id)

      await User.update(
        { ultimo_login: new Date() },
        { where: { id: user.id } }
      )
      delete user.dataValues.senha

      user.dataValues.token = token

      res.send(user)
    } catch (err) {
      next(err)
    }
  }

  async getUser(req, res, next) {
    try {
      const { id } = req.params
      const user_id = req.user_id
      if (parseInt(id) !== parseInt(user_id))
        return res.status(401).send({ message: 'Não autorizado', status: 401 })
      const user = await User.findOne({
        where: { id },
        attributes: [
          'id',
          'nome',
          'email',
          ['created_at', 'data_criacao'],
          ['updated_at', 'data_atualizacao'],
          'ultimo_login',
        ],
      })
      const last_login = this.moment(user.dataValues.ultimo_login).tz(
        'America/Sao_Paulo'
      )
      const currente_time = this.moment(new Date()).tz('America/Sao_Paulo')
      let time_difference = currente_time - last_login

      if (time_difference / 60000 > 30)
        return res.status(401).send({ message: 'Sessão inválida', status: 401 })

      res.send(user)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = UserController
