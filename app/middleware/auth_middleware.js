const jwt = require('jsonwebtoken')

const authenticate = (req, res, next) => {
  if (req.path === '/api/signUp' || req.path === '/api/signIn') return next()

  const authHeader = req.headers.authorization

  if (!authHeader)
    return res.status(401).send({ message: 'Não autorizado', status: 401 })

  const parts = authHeader.split(' ')
  if (!parts.length === 2)
    return res.status(401).send({ message: 'Não autorizado', status: 401 })

  const [scheme, token] = parts

  if (!scheme.match(/^Bearer$/))
    return res.status(401).send({ message: 'Não autorizado', status: 401 })

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: 'Não autorizado' })
    req.user_id = decoded.id

    return next()
  })
}

module.exports = authenticate
