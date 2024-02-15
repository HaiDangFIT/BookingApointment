const { notFound, errHandler } = require("../middlewares/errHandler");
const userRouter = require('./userRouter');
const specialtyRouter = require('./specialtyRouter');
const hospitalRouter = require('./hospitalRouter')

const initRoutes = (app) => {
  app.use("/api/user", userRouter);
  app.use("/api/specialty", specialtyRouter);
  app.use("/api/hospital", hospitalRouter);

  app.use(notFound);
  app.use(errHandler);
};

module.exports = initRoutes;
