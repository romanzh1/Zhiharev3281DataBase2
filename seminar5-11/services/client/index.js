const pool = require('../../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const secret = 'jwt_secret_value'

/**
 * signUp регистрирует нового клиента и
 * возвращает токен
 * @param {object} client
 * @param client.name
 * @param client.address
 * @param client.phone
 * @param client.email
 * @param client.password
 */
async function signUp(client) {
  const hash = await bcrypt.hash(client.password, 8)

  const { rows } = await pool.query(
    `
  Insert into _client (name, address, phone, email, password)
  Values ($1,$2,$3,$4,$5) Returning id, email;
  `,
    [client.name, client.address, client.phone, client.email, hash]
  )

  return jwt.sign(
    {
      id: rows[0].id,
      email: rows[0].email,
    },
    secret,
    {
      expiresIn: '1d',
    }
  )
}

/**
 * signIn ищет пользователя по email
 * и проверяет подлинность пароля, генерирует токен
 * @param {string} email
 * @param {string} password
 */
async function signIn(email, password) {
  const { rows } = await pool.query(
    `
  Select id, email, password
  From _client
  Where email = $1
  `,
    [email]
  )

  // если пользователь с таким email
  // не найден
  if (rows.length == 0) {
    throw new Error('User not found, 401 Unauthorized')
  }

  // проверяем правильность пароля
  const isValid = await bcrypt.compare(password, rows[0].password)
  if (!isValid) {
    throw new Error('Invalid password')
  }

  // если правильность введённых данных пользователем
  // подтверждена
  return jwt.sign(
    {
      id: rows[0].id,
      email: rows[0].email,
    },
    secret,
    {
      expiresIn: '1d',
    }
  )
}

module.exports = {
  signIn,
  signUp,
}