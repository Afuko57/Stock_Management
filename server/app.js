const express = require('express');
const bodyParser = require('body-parser');
const pool = require("./config/db.js");
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUI = require('swagger-ui-express');




const app = express();
const port = 3001;

app.use(bodyParser.json());

// ใช้ connection pool
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database');
  connection.release();
});

// Swagger Options
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stock Management API',
      version: '1.0.0',
      description: 'API for managing stock of products',
    },
  },
  apis: ['./routes/products.js','./routes/auth.js'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Routes
const productsRoute = require("./routes/products.js");
const authRoutes = require('./routes/auth.js');

app.use("/", productsRoute);
app.use('/auth', authRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
