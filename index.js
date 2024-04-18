import yargs from "yargs";
import http from "http";
import fs from "fs";
import { parse as parseUrl } from "url";
import jimp from "jimp";
import { exec } from "child_process";

// Definir la clave de acceso
const key = 123;

// Crear una instancia de yargs
const argv = yargs(process.argv.slice(2));

// Configurar yargs para manejar la línea de comandos
argv
  .command(
    "servidor",
    "Levantar servidor",
    {
      acceso: {
        describe: "Key",
        demand: true,
        alias: "k",
      },
    },
    (args) => {
      // Función de manejo de la línea de comandos
      if (args.acceso == key) {
        http.createServer((req, res) => {
          // Crear el servidor HTTP
          if (req.url === "/") {
            // Manejar la ruta raíz
            res.writeHead(200, { "Content-Type": "text/html" });
            fs.readFile("index.html", "utf8", (err, html) => {
              // Leer y enviar el contenido del archivo index.html
              if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Error interno del servidor");
                return;
              }
              res.end(html);
            });
        } else if (req.url === "/style") {
            // Manejar la ruta de estilos
            res.writeHead(200, { "Content-Type": "text/css" });
            fs.readFile("style.css", (err, css) => {
                // Leer y enviar el contenido del archivo style.css
                if (err) {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("404 Not Found");
                    return;
                }
                res.end(css);
            });
        
          } else if (req.url.includes("/imagen")) {
            const params = parseUrl(req.url, true).query;
            const url_imagen = params.ruta;
            
            // Usar ImageMagick para convertir la imagen a un formato admitido por Jimp
            exec(`convert "${url_imagen}" "${url_imagen}.jpg"`, (error, stdout, stderr) => {
              if (error) {
                console.error("Error al convertir la imagen:", error);
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("500 Internal Server Error: Error al convertir la imagen");
                return;
              }

              // Procesar la imagen convertida con Jimp
              jimp.read(`${url_imagen}.jpg`)
                .then((imagen) => {
                  return imagen
                    .resize(600, jimp.AUTO)
                    .grayscale()
                    .quality(60)
                    .writeAsync("newImg.jpg");
                })
                .then(() => {
                  fs.readFile("newImg.jpg", (err, Imagen) => {
                    if (err) {
                      console.error("Error al leer la imagen procesada:", err.message);
                      res.writeHead(500, { "Content-Type": "text/plain" });
                      res.end("500 Internal Server Error: Error al leer la imagen procesada");
                      return;
                    }
                    res.writeHead(200, { "Content-Type": "image/jpeg" });
                    res.end(Imagen);
                  });
                })
                .catch((err) => {
                  console.error("Error al procesar la imagen:", err.message);
                  res.writeHead(500, { "Content-Type": "text/plain" });
                  res.end("500 Internal Server Error: Error al procesar la imagen");
                });
            });
          }
        }).listen(3000, () => console.log("Servidor encendido", process.pid)); // Iniciar el servidor y mostrar el ID del proceso
      } else {
        console.log("Credenciales incorrectas"); 
      }
    }
  )
  .help()
  .parse(); 

