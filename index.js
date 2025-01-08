require("dotenv").config();
const express = require("express");
const Sequelize = require("sequelize");
const app = express();
const cors = require("cors");

// set environment variables
const PORT = process.env.PORT || 5000;

// parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// connect to the database
const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  storage: "./Database/shop_demo.sqlite",
});

const Type = sequelize.define("type", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
});

const Product = sequelize.define("product", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  },
  price: {
    type: Sequelize.FLOAT,
  },
  strImg: {
    type: Sequelize.STRING,
  },
  description: {
    type: Sequelize.STRING,
  },
});

Product.belongsTo(Type, {
  foreignKey: "typeId",
  as: "type", // alias for type table
});

// create tables if it doesn't exist
sequelize.sync().then(() => {
  console.log("Tables created.");
});

// create a new type
app.post("/type", async (req, res) => {
  try {
    const { name } = req.body;
    const type = await Type.create({ name });
    return res.json(type);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// create a new product or multiple products
app.post("/product", async (req, res) => {
  try {
    const products = req.body; // Can be a single product object or an array of products

    // Check if the input is an array
    if (Array.isArray(products)) {
      // Validate and create multiple products
      const createdProducts = [];
      const errors = [];

      for (const product of products) {
        try {
          const { name, price, img, description, typeId } = product;

          // Validation
          if (!name || !price || !typeId) {
            throw new Error("Each product must have a name, price, and typeId");
          }

          const newProduct = await Product.create({
            name,
            price,
            strImg: img || null,
            description: description || null,
            typeId,
          });

          createdProducts.push(newProduct);
        } catch (error) {
          errors.push({ error: error.message, product });
        }
      }

      return res.status(207).json({
        created: createdProducts,
        errors,
      });
    } else {
      // Assume single product object
      const { name, price, img, description, typeId } = products;

      // Validation
      if (!name || !price || !typeId) {
        return res
          .status(400)
          .json({ error: "Name, price, and typeId are required" });
      }

      const product = await Product.create({
        name,
        price,
        strImg: img || null,
        description: description || null,
        typeId,
      });

      return res.status(201).json(product);
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ error: "Failed to create product(s)", details: err.message });
  }
});

// get all products
app.get("/product", async (req, res) => {
  try {
    const products = await Product.findAll();
    return res.json(products);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// get all types
app.get("/type", async (req, res) => {
  try {
    const types = await Type.findAll();
    return res.json(types);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// get all products by type
app.get("/product/type/:typeId", async (req, res) => {
  try {
    const { typeId } = req.params;
    const products = await Product.findAll({
      where: {
        typeId,
      },
    });
    return res.json(products);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// get a product by id
app.get("/product/id/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    return res.json(product);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
});

// start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
