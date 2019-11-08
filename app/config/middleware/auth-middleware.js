const jwt = require('jsonwebtoken')

const authenticate = (req, res, next) => {
  if (req.path === '/api/signUp' || req.path === '/api/signIn') return next()

  const authHeader = req.headers.authorization

  if (!authHeader) return res.status(401).send({ error: 'No token provided' })

  const parts = authHeader.split(' ')
  if (!parts.length === 2) return res.status(401).send({ error: 'Token error' })

  const [scheme, token] = parts

  if (!scheme.match(/^Bearer$/))
    return res.status(401).send({ error: 'Token malformatted' })

  jwt.verify(token, process.env.SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ error: 'Token invalid' })
    req.user_id = decoded.id

    return next()
  })
}

module.exports = authenticate
