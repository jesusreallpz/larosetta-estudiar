# Pizzas La Rosetta

Web para aprender de memoria las pizzas de la carta de La Rosetta y sus ingredientes. Funciona sin servidor, solo con HTML, CSS y JavaScript, y está pensada para usarla desde el móvil.

## Qué tiene

- **Mi lista:** elige las pizzas que tienes que aprender (por ejemplo las cinco que te pide tu jefa). Fichas, Quiz y Comanda pueden usar solo esa lista. Aquí también está el botón **Restablecer progreso**.
- **Fichas:** ves el nombre, piensas qué lleva y compruebas.
- **Quiz:** se contesta escribiendo, sin lista de opciones. "¿Qué lleva?" (escribes los ingredientes uno a uno), "¿Qué pizza es?" (ves los ingredientes y escribes el nombre) y "Foto" (ves la foto y escribes el nombre).
- **Comanda:** entran de 3 a 7 pizzas a la vez, con cronómetro, y las cantas de memoria.
- **Carta:** buscador por pizza o por ingrediente, con miniaturas de las fotos.

El progreso y la lista se guardan en el navegador de cada dispositivo. No se sincronizan entre móviles ni ordenadores.

## Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Estructura de la página |
| `style.css` | Todos los estilos, con modo claro y oscuro |
| `data.js` | Las pizzas y sus ingredientes. Si cambia la carta, se edita solo este archivo |
| `photos.js` | Las fotos de las pizzas (12 por ahora), guardadas dentro del archivo para no necesitar carpetas |
| `app.js` | Las pantallas y su comportamiento |

## Subirla a GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `la-rosetta`), público.
2. Entra en el repositorio, pulsa **Add file → Upload files** y sube los cinco archivos (`index.html`, `style.css`, `data.js`, `photos.js`, `app.js`) y este `README.md`. Todos van en la raíz, sin carpetas.
3. Pulsa **Commit changes**.
4. Ve a **Settings → Pages**. En **Build and deployment**, elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`, y guarda.
5. Espera un par de minutos. La web quedará en `https://TU-USUARIO.github.io/la-rosetta/`.

## Cambiar la carta

Abre `data.js`. Cada pizza es una fila con su nombre y sus ingredientes. Cada ingrediente lleva al final dos puntos y una letra que indica su categoría (y su color). La lista de letras está explicada al principio del archivo.

## Fotos

Hay foto de 9 napolitanas y de las 3 pinsas. Las romanas todavía no tienen. El juego de fotos solo usa las pizzas que tienen foto. Para añadir más, hay que meter cada foto en `photos.js`, que es más fácil pedírselo a Claude pasándole las imágenes.
