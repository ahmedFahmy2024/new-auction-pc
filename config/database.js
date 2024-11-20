const mongoose = require("mongoose");

const dbConnection = () => {
  mongoose.connect(process.env.DB_URI).then((conn) => {
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  });
  // .catch((err) => {
  //   console.error(`MongoDB Error: ${err.message}`);
  //   process.exit(1);
  // });
};

module.exports = dbConnection;
