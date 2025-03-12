const forceDatabaseRefresh = false;

import express from 'express';
import sequelize from './config/connection.js';
import routes from './routes/index.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;


// Serves static files in the entire client's dist folder
app.use(express.static('../client/dist'));

app.use(express.json());
app.use(routes);
app.get('*', (req
  , res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
}
);

sequelize.sync({force: forceDatabaseRefresh}).then(() => {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});
