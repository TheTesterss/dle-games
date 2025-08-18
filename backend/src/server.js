require("dotenv").config();
const app = require("./app");
const PORT = process.env.PORT || 8080;
const connectMongo = require("./config/database");

const startServer = () => {
  try {
    connectMongo();
    app.listen(PORT, () => {
      console.log("Server is running on port: ", PORT);
    });
  } catch (e) {
    console.error("Error starting server: ", e);
  }
};

startServer();
