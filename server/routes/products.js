const express = require("express");
const pool = require("../config/db.js");

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 name: Product 1
 *                 quantity: 10
 */
router.get("/api/products", (req, res) => {
  pool.query("SELECT * FROM products", (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags:
 *       - Products
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             name: New Product
 *             quantity: 5
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post("/api/products", (req, res) => {
  const { name, quantity } = req.body;
  pool.query("INSERT INTO products (name, quantity) VALUES (?, ?)", [name, quantity], (err, result) => {
    if (err) throw err;
    res.status(201).send("Product created successfully");
  });
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the product
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             name: Updated Product
 *             quantity: 8
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put("/api/products/:id", (req, res) => {
  const productId = req.params.id;
  const { name, quantity } = req.body;
  pool.query("UPDATE products SET name = ?, quantity = ? WHERE id = ?", [name, quantity, productId], (err, result) => {
    if (err) throw err;
    res.send("Product updated successfully");
  });
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         description: ID of the product
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete("/api/products/:id", (req, res) => {
  const productId = req.params.id;
  pool.query("DELETE FROM products WHERE id = ?", [productId], (err, result) => {
    if (err) throw err;
    res.send("Product deleted successfully");
  });
});

module.exports = router;


/**
 * @swagger
 * /api/products/sell:
 *   post:
 *     summary: Update product quantity when sold
 *     tags:
 *       - Inventory Tracking
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             productId: 1
 *             quantitySold: 3
 *     responses:
 *       200:
 *         description: Product quantity updated successfully
 */
router.post("/api/products/sell", (req, res) => {
  const { productId, quantitySold } = req.body;

  pool.getConnection((err, connection) => {
    if (err) throw err;

    connection.beginTransaction((err) => {
      if (err) throw err;

      // Update product quantity
      pool.query("UPDATE products SET quantity = quantity - ? WHERE id = ?", [quantitySold, productId], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            throw err;
          });
        }

        // Record transaction 
        pool.query("INSERT INTO transactions (product_id, transaction_type, quantity_changed) VALUES (?, 'sale', ?)", [productId, quantitySold], (err, result) => {
          if (err) {
            return connection.rollback(() => {
              throw err;
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                throw err;
              });
            }
            res.send("Product quantity updated successfully");
          });
        });
      });
    });
  });
});

/**
 * @swagger
 * /api/products/purchase:
 *   post:
 *     summary: Update product quantity when purchased
 *     tags:
 *       - Inventory Tracking
 *     requestBody:
 *       content:
 *         application/json:
 *           example:
 *             productId: 1
 *             quantityPurchased: 5
 *     responses:
 *       200:
 *         description: Product quantity updated successfully
 */
router.post("/api/products/purchase", (req, res) => {
  const { productId, quantityPurchased } = req.body;

  pool.getConnection((err, connection) => {
    if (err) throw err;

    connection.beginTransaction((err) => {
      if (err) throw err;

      // Update product quantity
      pool.query("UPDATE products SET quantity = quantity + ? WHERE id = ?", [quantityPurchased, productId], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            throw err;
          });
        }

        // Record transaction
        pool.query("INSERT INTO transactions (product_id, transaction_type, quantity_changed) VALUES (?, 'purchase', ?)", [productId, quantityPurchased], (err, result) => {
          if (err) {
            return connection.rollback(() => {
              throw err;
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                throw err;
              });
            }
            res.send("Product quantity updated successfully");
          });
        });
      });
    });
  });
});