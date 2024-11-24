// server.js file
const path = require("path");
const express = require("express");
const dotenv = require("dotenv").config({ path: "config.env" });
const morgan = require("morgan");
const cors = require("cors");

const dbConnection = require("./config/database");
const globalError = require("./middlewares/errorMiddlewares");
const ApiError = require("./utils/ApiError");

const auctionsRoute = require("./routes/auctionRoute");
const projectsRoute = require("./routes/projectRoute");
const pricesRoute = require("./routes/priceRoute");
const contactsRoute = require("./routes/contactRoute");
const bannerRoute = require("./routes/bannerRoute");

// connect with db
dbConnection();

// express app
const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// middleware
app.use(express.json({ limit: "10kb" })); // body parser and limit(security)
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

app.get("/", (req, res) => {
  res.send("Welcome to Courses Platform");
});

// mount routes
app.use("/api/v1/auctions", auctionsRoute);
app.use("/api/v1/projects", projectsRoute);
app.use("/api/v1/prices", pricesRoute);
app.use("/api/v1/contacts", contactsRoute);
app.use("/api/v1/banners", bannerRoute);

// handle all other routes
app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find this route ${req.originalUrl}`, 404));
});

// Global error handler middleware for express
app.use(globalError);

const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// handle unhandled promise rejections outside of express
process.on("unhandledRejection", (err) => {
  console.log(`unhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.log("Shutting down server...");
    process.exit(1);
  });
});
