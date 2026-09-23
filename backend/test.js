const { Client } = require('pg');
const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'postgres',
  database: 'retama_db'
});
client.connect()
  .then(() => console.log('Connected directly to port 5433'))
  .catch(e => console.error('Error connecting to port 5433', e))
  .finally(() => client.end());

const client2 = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'retama_db'
});
client2.connect()
  .then(() => console.log('Connected directly to port 5432'))
  .catch(e => console.error('Error connecting to port 5432', e))
  .finally(() => client2.end());
