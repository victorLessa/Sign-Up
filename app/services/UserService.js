class UserService {
  constructor(sequelize, User, Phone, moment) {
    this.sequelize = sequelize
    this.user = User
    this.phone = Phone
    this.moment = moment
  }
  async findUserByEmail({ email }) {
    let user = await this.user.findOne({
      where: { email },
      attributes: [
        'id',
        'senha',
        ['created_at', 'data_criacao'],
        ['updated_at', 'data_atualizacao'],
        'ultimo_login',
      ],
    })
    return user
  }
  async transactionUserCreate({ nome, email, senha, telefones }) {
    return await this.sequelize.transaction().then(t => {
      return this.user
        .create(
          {
            nome,
            email,
            senha,
            ultimo_login: new Date(),
          },
          { transaction: t }
        )
        .then(async user => {
          for (let statement of telefones) {
            await this.phone.create(
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
          return await this.user.findOne({
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
  }
  async findUserById({ id }) {
    let user = await this.user.findOne({
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
    return user
  }
  async timeDifference(user) {
    const last_login = this.moment(user.dataValues.ultimo_login).tz(
      'America/Sao_Paulo'
    )
    const currente_time = this.moment(new Date()).tz('America/Sao_Paulo')
    let time_difference = currente_time - last_login
    return time_difference / 60000
  }
  async timeZone(date) {
    this.moment.locale('pt-br')
    return await this.moment(date)
      .tz('America/Sao_Paulo')
      .format('LLL')
  }
}

module.exports = UserService
