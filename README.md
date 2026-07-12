# Notiva — sitio de práctica para GTM + GA4

Sitio **ficticio** (no representa ninguna empresa real) creado para el ejercicio:
*"Plantilla de GTM reutilizable para proyectos GA4"*.

## Estructura
- `index.html` — home
- `servicios.html` — detalle de los 4 servicios (email, SMS, firma, eKYC)
- `precios.html` — paquetes de créditos por servicio (ecommerce GA4)
- `carrito.html` — carrito / checkout
- `registro.html`, `login.html` — alta de cuenta (obligatoria antes de comprar)
- `gracias.html` — confirmación de pedido (evento `purchase`)
- `contacto.html` — formulario de contacto (`generate_lead`)
- `cuenta.html` — panel de cuenta ficticio
- `css/styles.css`, `js/app.js` — estilos y lógica (carrito, sesión, dataLayer)
- `assets/dossier-notiva.pdf` — archivo de ejemplo para probar el evento de *descarga de archivo*

## Fase 1 — Instalar GTM
Cada archivo `.html` tiene dos comentarios marcando dónde va el snippet:
```html
<!-- Fin snippet GTM cabecera -->      (dentro de <head>)
<!-- Fin GTM (noscript) -->            (justo después de <body>)
```
Sustituye esos comentarios por el snippet real de tu contenedor GTM **en las 9 páginas**
(puedes hacerlo con un buscar/reemplazar si subes el sitio a tu propio editor).
Después crea la etiqueta de configuración GA4 con activador *All Pages* y valida en Vista previa.

## Fase 2 — Variables, activadores y eventos GA4
`js/app.js` ya empuja automáticamente estos eventos al `dataLayer`:
- `contacto_whatsapp` → al pulsar el botón flotante o el botón de WhatsApp de Contacto
- `generate_lead` → al enviar el formulario de Contáctanos (incluye `servicio_interes`, `empresa`)
- `sign_up` / `login` → al registrarse / iniciar sesión

La medición mejorada (scroll, clics salientes, descarga de archivos) se activa sola en
cuanto configures la etiqueta GA4 con medición mejorada — el sitio ya incluye enlaces
salientes (LinkedIn, X, WhatsApp) y un PDF descargable para poder probarla.

## Fase 3 — DataLayer + Ecommerce GA4
En `precios.html`:
- Al cambiar de pestaña de servicio → `view_item_list`
- Al pulsar "Ver ficha del paquete" → `view_item`
- Al pulsar "Comprar créditos" → `add_to_cart`

En `carrito.html`:
- Al cargar con productos en el carrito → `view_cart`
- Al pulsar "Finalizar compra" → `begin_checkout` (y redirige a login/registro si no hay sesión)

En `gracias.html`:
- Al cargar tras completar el registro/login → `purchase` (con `transaction_id`, `value`, `tax`, `items`)

Todos los eventos de ecommerce siguen el formato estándar de GA4 (`ecommerce.items[]`
con `item_id`, `item_name`, `item_category`, `price`, `quantity`, `currency`), y cada
push va precedido de `dataLayer.push({ecommerce: null})` como recomienda Google para
evitar arrastrar datos de un evento a otro.

Abre la consola del navegador: cada `dataLayer.push` se imprime también con
`console.log` para que puedas verificarlo sin depender aún de GTM.

## Fase 4 — QA y documentación
- Usa **Vista previa de GTM** y **Tag Assistant** en cada flujo: home → precios → añadir
  al carrito → carrito → registro → confirmación; y también el formulario de contacto.
- Verifica en GA4 → Informes → Tiempo real que llegan los eventos con sus parámetros.
- Exporta el contenedor como `.json` y añade tu mini-guía de 1-2 páginas.

## Publicar en GitHub Pages
1. Crea un repositorio nuevo y sube todo el contenido de esta carpeta a la raíz (o a `/docs`).
2. En *Settings → Pages*, activa GitHub Pages sobre la rama y carpeta donde subiste los archivos.
3. Usa la URL pública que te da GitHub para instalar y probar tu contenedor GTM en real.
