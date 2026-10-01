// Configuracion de Karma para las pruebas unitarias con Jasmine.
// Karma abre un navegador real, ejecuta las pruebas ahi y reporta el resultado.

process.env.CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

module.exports = function (config) {
  config.set({

    // Jasmine aporta describe / it / expect
    frameworks: ["jasmine", "webpack"],

    // Todos los archivos que terminen en .prueba.jsx
    files: [
      "pruebas/**/*.prueba.jsx"
    ],

    // Antes de ejecutar, webpack traduce el JSX a JavaScript normal
    preprocessors: {
      "pruebas/**/*.prueba.jsx": ["webpack"]
    },

    webpack: {
      mode: "development",
      devtool: "inline-source-map",
      resolve: {
        extensions: [".js", ".jsx"]
      },
      module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader",
              options: {
                presets: [
                  "@babel/preset-env",
                  ["@babel/preset-react", { runtime: "automatic" }]
                ]
              }
            }
          }
        ]
      }
    },

    webpackMiddleware: {
      stats: "errors-only"
    },

    // Como se muestran los resultados en la terminal
    reporters: ["progress"],

    // El navegador donde corren: Chrome sin ventana visible
    browsers: ["ChromeHeadless"],

    // Corre una vez y termina, en vez de quedarse esperando cambios
    singleRun: true,
    autoWatch: false
  });
};
