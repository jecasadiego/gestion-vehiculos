const app = require("./app");

const port = Number.parseInt(process.env.PORT || "3000", 10);

Promise.resolve(app.locals.startupPromise)
  .then(() => {
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Autos Colombia API activa en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Error al iniciar la aplicacion:", error);
    process.exit(1);
  });
