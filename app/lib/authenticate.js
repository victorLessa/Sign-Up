const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
class Authenticate {
  async generateToken(user_id) {
    const token = jwt.sign({ id: user_id }, process.env.SECRET, {
      expiresIn: process.env.EXPIRES_IN,
    })
    return token
  }
  async hashCompare(currentPassword, password) {
    return await bcrypt.compare(currentPassword, password)
  }
  async hashPassword(password) {
    return await bcrypt.hash(password, 10)
  }
}

module.exports = Authenticate
