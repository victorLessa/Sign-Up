const chai = require('chai')
const server = require('../app/serve')

const chaitHttp = require('chai-http')
const should = chai.should()
chai.use(chaitHttp)

describe('Users', () => {
  let user_id
  it('Register sucess', done => {
    const body = {
      nome: 'ccd',
      email: 'victo@gdmail.codsdsssddassssaaam',
      senha: '123',
      telefones: [
        {
          numero: '123456789',
          ddd: '11',
        },
      ],
    }

    chai
      .request(server)
      .post('/api/signUp')
      .send(body)
      .end((err, res) => {
        if (err) return done(err)
        res.should.have.status(200)
        res.body.should.have.property('id')
        res.body.should.have.property('data_criacao')
        res.body.should.have.property('data_atualizacao')
        res.body.should.have.property('token')
        user_id = res.body.id
        done()
      })
  })
  it('Register with validation error', done => {
    const body = {
      nome: null,
      email: 'victo@gdmail.codsdsssddassssaaam',
      senha: '123',
      telefones: [
        {
          numero: '123456789',
          ddd: '11',
        },
      ],
    }
    chai
      .request(server)
      .post('/api/signUp')
      .send(body)
      .end((err, res) => {
        if (err) return done(err)
        res.should.have.status(401)
        res.body.should.have.property('message')
        res.body.should.have.property('status')
        res.body.status.should.be.eql(401)
        done()
      })
  })
})
