# Guía de Estilos — Colombia Boat Detailing

## 🎨 Paleta de Colores

### Fondos (Background)
- **Oscuro (Página principal)**: `#071428` (navy profundo) o `bg-navy-900` (Tailwind)
- **Blanco (Artículos/Guías)**: `#ffffff` o `bg-white` (Tailwind)
- **Blanco/Claro alterno**: `#f8fafc` o `bg-slate-50` (Tailwind)

### Texto

#### Para fondos OSCUROS (#071428 o navy-900)
- **Titulares**: `#f1f5f9` (gris muy claro) ✓ **BIEN**
- **Párrafos/Cuerpo**: `#cbd5e1` (gris claro) ✓ **BIEN**
- **Texto destacado**: `#ffffff` (blanco puro) ✓ **BIEN**

#### Para fondos CLAROS (blanco o #f8fafc)
- **Titulares**: `#1e3a5f` (azul oscuro) ✓ **BIEN**
- **Párrafos/Cuerpo**: `#1e293b` (gris oscuro) ✓ **BIEN**
- **Texto secundario**: `#475569` (gris medio) ✓ **BIEN**
- **❌ NUNCA usar**: `#f1f5f9`, `#cbd5e1`, `#e2e8f0` en fondos claros

### Acentos
- **Dorado**: `#d4af37` o `#b8904d` o `bg-gold-400` (Tailwind)
- **Verde (alertas)**: `#1f7a4a`
- **Rojo (advertencias)**: `#b91c1c`

## 📄 Estructura de Estilos

El sitio usa **3 niveles de estilos**:

### 1. Tailwind CSS (`css/tailwind.css`)
- Clases utilitarias para componentes principales
- Usar para: layout, spacing, responsive design
- **Ejemplo**: `class="bg-white text-slate-800"`

### 2. Estilos Globales (`css/styles.css`)
- Estilos compartidos entre páginas
- Usar para: navegación, componentes reutilizables
- **Ej**: `.nav-dropdown-link`, `.review-card`

### 3. Estilos Inline (`<style>` en cada HTML)
- Específicos de cada página (artículos, guías, cotizaciones)
- Contiene: `.prose`, `.guide-content`, `.terms-section`, etc.

## 🔧 Cómo Hacer Cambios Consistentes

### Si cambias colores de TEXTO en artículos de blog:
1. Todos los artículos en `/blog` tienen la estructura:
   ```html
   <body class="bg-white text-slate-800">
     <article>
       <div class="prose"> <!-- Aquí está el contenido -->
   ```

2. Los estilos están en el `<style>` al inicio de cada archivo:
   ```css
   .prose p { color: #1e293b; }        /* Para fondos blancos */
   .prose h2 { color: #1e3a5f; }       /* Para fondos blancos */
   .prose strong { color: #1e3a5f; }   /* Para fondos blancos */
   ```

3. **Cambiar en todos de una vez**:
   ```bash
   find blog -name "index.html" -type f -print0 | \
   xargs -0 sed -i 's/color: #cbd5e1;/color: #1e293b;/g'
   ```

### Si cambias colores de TEXTO en guías:
1. Guías en `/guias/` usan clase `.guide-content`:
   ```css
   .guide-content { color: #1e293b; }  /* Para fondos blancos */
   ```

2. Cambiar en todas las guías:
   ```bash
   find guias -name "*.html" -type f -print0 | \
   xargs -0 sed -i 's/color: #cbd5e1;/color: #1e293b;/g'
   ```

## ⚠️ Errores Comunes a Evitar

| ❌ **INCORRECTO** | ✓ **CORRECTO** | **Motivo** |
|---|---|---|
| `color: #f1f5f9` en body blanco | `color: #1e3a5f` en body blanco | Contraste insuficiente |
| `color: #cbd5e1` en body blanco | `color: #1e293b` en body blanco | Contraste insuficiente |
| Cambiar 1 artículo manualmente | Usar sed para cambiar todos | Inconsistencia entre páginas |
| No verificar contraste en mobile | Abrir en Firefox DevTools (mobile view) | Puede verse diferente en móvil |

## 🎯 Colores por Tipo de Página

### Página Principal & Servicios
- **Body**: `bg-navy-900` (#071428)
- **Texto**: `#cbd5e1` (párrafos), `#f1f5f9` (títulos)
- **Buttons**: `bg-gold-400`, `text-navy-900`

### Artículos de Blog
- **Body**: `bg-white`
- **`.prose` text**: `#1e293b` (párrafos), `#1e3a5f` (títulos)
- **Info boxes**: `background: #f8fafc;`, `text: #1e293b`

### Guías de Cuidado
- **Body**: `bg-white`
- **`.guide-content`**: `#1e293b` (párrafos), `#1e3a5f` (títulos)
- **Alert boxes**: fondos claros (`#f0faf5`, `#fff1f1`) con texto oscuro

### Cotizaciones (PDF)
- **Body**: `#edf2f7`
- **Invoice**: `#ffffff` con bordes navy
- **Terms section**: `#050b14` (oscuro) con `#e2e8f0` (claro)

## 📱 Checklist para Cambios de Estilos

Antes de hacer cambios masivos:

- [ ] ¿El fondo es oscuro o claro?
- [ ] ¿El color de texto tiene buen contraste? (prueba con https://webaim.org/resources/contrastchecker/)
- [ ] ¿Afecta múltiples páginas? → Usar `sed` en batch
- [ ] ¿Es un cambio aislado? → Editar solo ese archivo
- [ ] ¿Probé en mobile view?
- [ ] ¿Hice commit y push?

## 📖 Referencias Rápidas

**Cuando necesites cambiar colores de texto en batch:**
```bash
# En blogs
find blog -name "index.html" -print0 | xargs -0 sed -i 's/COLOR_VIEJO/COLOR_NUEVO/g'

# En guías
find guias -name "*.html" -print0 | xargs -0 sed -i 's/COLOR_VIEJO/COLOR_NUEVO/g'

# En todo el sitio
find . -name "*.html" -print0 | xargs -0 sed -i 's/COLOR_VIEJO/COLOR_NUEVO/g'
```

**Verificar cambios antes de commitear:**
```bash
git add -A
git diff --cached --stat
```

---

**Última actualización**: 04/06/2026  
**Responsable**: Claude Code
