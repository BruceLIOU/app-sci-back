const express = require("express");
const formidable = require("express-formidable");
const cors = require("cors");

require("dotenv").config();

// const property = require("./routes/property.routes");

const app = express();
const corsOptions = {
  origin: "http://localhost:3001",
};

app.use(formidable({ multiples: true }));
app.use(cors(corsOptions));

const db = require("./models");
try {
  db.sequelize.sync({ force: true });
  //   db.sequelize.sync({ force: true }).then(() => {
  //     console.log("🟢 Connexion à la base de données réussie !");
  //     console.log("Drop and re-sync db.");
  //   });
  console.log(
    "🟢 Connexion à la base de données réussie ! Drop and re-sync db."
  );
} catch (error) {
  console.log("🔴 Connexion à à la base de données échouée !", error.message);
}

// app.use("/api/properties", property);
require("./routes/property.routes")(app);

app.get("/", (req, res) => {
  res.status(201).json("🟢  Welcome to SCI WEB APP");
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "🚫 Page not found !" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`🟢 Server started on port ${process.env.PORT}`);
});
