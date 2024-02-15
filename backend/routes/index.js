const { notFound, errHandler } = require("../middlewares/errHandler");
const userRouter = require('./userRouter');
const specialtyRouter = require('./specialtyRouter');

const initRoutes = (app) => {
  app.use("/api/user", userRouter);
  app.use("/api/specialty", specialtyRouter);

  app.use(notFound);
  app.use(errHandler);
};

module.exports = initRoutes;
