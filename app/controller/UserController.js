'user strict'
const { sequelize, User, Phone } = require('../models/index')
require('dotenv').config()

const Authenticate = require('../lib/authenticate')

class UserController extends Authenticate {
  constructor(moment) {
    super()
    this.moment = moment
  }
  async store(req, res, next) {
    try {
      let { nome, email, senha, telefones } = req.body

      let user = await User.findOne({
        where: { email },
      })

      if (user) {
        return res
          .status(401)
          .send({ message: 'E-mail já existente', status: 401 })
      }

      senha = await this.hashPassword(senha)

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
        return res
          .status(401)
          .send({ message: 'Usuário e/ou senha inválidos', status: 401 })
      }

      if (!(await this.hashCompare(senha, user.senha))) {
        return res
          .status(401)
          .send({ message: 'Usuário e/ou senha inválidos', status: 401 })
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
  async timeDifference(user) {
    const last_login = this.moment(user.dataValues.ultimo_login).tz(
      'America/Sao_Paulo'
    )
    const currente_time = this.moment(new Date()).tz('America/Sao_Paulo')
    let time_difference = currente_time - last_login
    return time_difference / 60000
  }
  async getUser(req, res, next) {
    try {
      const { user_id: id } = req.params

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

      if ((await this.timeDifference(user)) > 30)
        return res.status(401).send({ message: 'Sessão inválida', status: 401 })

      res.send(user)
    } catch (err) {
      next(err)
    }
  }
}

module.exports = UserController
