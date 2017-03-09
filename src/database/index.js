import Knex from 'knex'
import knexConfig from './knexfile'

export default new Knex(knexConfig[process.env.NODE_ENV])
