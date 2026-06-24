# Colombia Boat Detailing — Sitio Web

Sitio corporativo de **Colombia Boat Detailing**, servicio de detailing y mantenimiento naval en
Cartagena de Indias, Colombia. Sitio estático multipágina (HTML + Tailwind), optimizado para
rendimiento y SEO local e internacional, desplegado en Vercel.

- **Producción:** https://www.colombiaboatdetailing.com
- **Stack:** HTML estático · Tailwind CSS (compilado) · JavaScript vanilla · Phosphor Icons · PWA
- **Hosting:** Vercel (sin build server — se sirve la raíz del repo, `outputDirectory: "."`)

---

## Estructura

```
.
├── index.html                     # Home
├── about.html, contacto.html      # Institucionales
├── services.html                  # Hub de servicios
│
├── <servicio>.html                # Páginas de servicio
│   (ppf, ceramic-coating, gelcoat, paint-polishing, hull-cleaning,
│    engine-painting, boat-painting, bottom-paint, interior-detailing,
│    anti-corrosion, electrical-systems, technical-wash, fibra,
│    cubierta-teka, cubierta-sintetica, calcomanias, polarizado)
│
├── limpieza-casco-<zona>.html     # Landings SEO local (Bocagrande, Barú, Rosario, Manzanillo)
├── pulido-gelcoat-<zona>.html     # Landings SEO local de pulido
├── hull-cleaning*-en.html         # Versiones en inglés (limpieza de casco + zonas)
│
├── blog.html  ·  blog/<slug>/     # Blog (un index.html por artículo)
│
├── css/        # styles.css (custom) + tailwind.css (compilado) + tailwind-input.css (fuente)
├── js/         # main.js (layout global, nav, i18n, UX) + blog-catalog.js
├── fonts/      # Inter + Playfair Display self-hosted (woff2)
├── images/     # Imágenes .webp
├── vendor/     # Phosphor Icons
│
├── cotizaciones/ · facturas/ · finanzas.html · business-card.html
│                                  # Herramientas internas (bloqueadas en robots.txt)
│
├── tools/      # Scripts puntuales de mantenimiento (NO se despliegan; ver .vercelignore)
├── sitemap.xml · robots.txt · manifest.webmanifest · sw.js · vercel.json
└── package.json                   # Solo scripts de build de assets (dev)
```

---

## Internacionalización (i18n)

Estrategia híbrida:

- **Español (es-CO):** idioma principal, todas las páginas.
- **Inglés:** páginas reales e indexables para limpieza de casco y sus zonas
  (`hull-cleaning*-en.html`), enlazadas con **hreflang recíproco** (`es-CO` / `en` / `x-default`→ES).
- **Selector de idioma + autodetección:** implementados en `js/main.js`.
  - El mapa `I18N_PAIRS` define las parejas ES↔EN. Para añadir un idioma a una página:
    crear la página EN y añadir la pareja al mapa — el selector y el hreflang dejan de requerir
    edición manual del nav.
  - En la primera visita se lee `navigator.language`: si el navegador está en inglés y existe la
    versión EN de la página, se ofrece un banner para cambiar (se recuerda la elección).
  - **Otros idiomas (FR, DE, PT…):** se delega en la traducción nativa del navegador
    (los `lang` están correctos y no se bloquea la traducción). En páginas sin versión EN propia,
    el botón "EN" del selector muestra ayuda para traducir.

---

## Desarrollo

No requiere servidor: abrir `index.html`. Para previsualizar con rutas absolutas, servir la raíz
con cualquier servidor estático (p. ej. `npx serve .`).

### Rebuild de assets (solo si se editan estilos/JS fuente)

```bash
npm install          # instala devDependencies (tailwind, terser, clean-css)
npm run build        # compila Tailwind, minifica css/styles.css y js/*.js
```

> `build:js` minifica `js/main.js` **in situ** (la fuente y el output son el mismo archivo).

---

## SEO

- Meta tags, Open Graph y Twitter Cards por página · canonical autorreferente.
- Geo tags para SEO local (Cartagena / Bolívar) · datos estructurados JSON-LD.
- `sitemap.xml` + `robots.txt` (bloquea herramientas internas y scrapers; permite bots de IA).
- Landings por zona para intención local; hreflang para las páginas con versión EN.

---

**Despliegue:** push a la rama conectada en Vercel. Los redirects (apex→www, `*/index.html`→limpia,
consolidaciones) viven en `vercel.json`.
