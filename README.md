# Cartagena Boat Detailing - Sitio Web Multipágina Profesional

## 📋 Descripción del Proyecto

Sitio web corporativo profesional para **Cartagena Boat Detailing**, un servicio especializado de detailing marino en Cartagena, Colombia. Diseñado con estándares internacionales y una experiencia de usuario inmersiva.

---

## 📁 Estructura de Carpetas

```
cartagena-boatdetailing/
├── index.html                 # Página principal
├── about.html                 # Página "Sobre Nosotros"
├── blog.html                  # Página de Blog
├── css/
│   └── styles.css            # Estilos personalizados y animaciones
├── js/
│   └── main.js               # Scripts principales (interacciones, animaciones)
├── images/                   # Carpeta para imágenes del sitio
└── README.md                 # Este archivo
```

---

## 🎨 Características Principales

### 1. **Sitio Multipágina**

- **index.html**: Página de inicio con hero con secciones de servicios, testimonios, proceso y contacto
- **about.html**: Información sobre la empresa, equipo y alianzas estratégicas
- **blog.html**: Artículos educativos sobre detailing marino y mantenimiento de embarcaciones

### 2. **Efectos Visuales Avanzados**

- **Animaciones al hacer scroll**:
  - Fade-in (desvanecimiento)
  - Slide-in (deslizamiento desde los lados)
  - Scale-up (ampliación)
  - Staggered items (animación escalonada)
- **Parallax effect** para secciones especiales
- **Hover effects** personalizados en tarjetas y elementos interactivos
- **Navbar dinámico** que cambia de estilo al hacer scroll

### 3. **Componentes Profesionales**

#### Navbar/Menú

- Menú responsivo con dropdown de servicios
- Menú móvil overlay animado
- Logo con efecto interactivo
- Indica la página activa

#### Formulario de Contacto

- Validación de campos
- Checkboxes para seleccionar servicios de interés
- Diseño moderno y funcional

#### Sección de Reseñas

- Grid de 6 tarjetas con testimoniosprofesionales
- Sistema de 5 estrellas
- Efectos hover mejorados

#### Footer Responsivo

- Enlaces a servicios, empresa y contacto
- Información de contacto
- Menor extensión en dispositivos móviles
- Diseño consistente en todas las páginas

### 4. **Responsive Design**

- Completamente adaptable a dispositivos móviles
- Breakpoints optimizados (mobile, tablet, desktop)
- Menú móvil con overlay deslizable
- Grillas que se adaptan al tamaño de pantalla

### 5. **Servicios Presentados**

1. **PPF (Paint Protection Film)** - Protección de por vida
2. **Ceramic Coating Certificado** - Protección nanotecnológica
3. **Restauración de Gelcoat** - Eliminación de oxidación
4. **Interiores & Tapicería** - Limpieza profunda
5. **Control Anticorrosivo** - Prevención de óxido
6. **Pintura de Motores** - Restauración visual
7. **Pintura de Fondo** - Antifouling profesional
8. **Lavado Técnico Detallado** - Descontaminación

---

## 🚀 Cómo Usar el Sitio

### Navegación Principal

- **Logo/Inicio**: Lleva a `index.html`
- **Servicios**: Dropdown con enlaces a la sección de servicios principales
- **Sobre Nosotros**: Link a `about.html`
- **Blog**: Link a `blog.html`
- **Reseñas**: Sección en `index.html`
- **Agendar Cita**: Link al formulario de contacto

### Efectos de Scroll

- Navega a través del sitio para ver animaciones automáticas
- Las secciones se animan al entrar en el viewport
- Imágenes tienen efecto hover (grayscale a color)
- Tarjetas se elevan y cambian estilo al pasar el mouse

### Formulario de Contacto

- Completa tus datos
- Selecciona los servicios de interés
- El formulario valida antes de enviar

---

## 🛠️ Instalación y Configuración

### Requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- No requiere servidor backend

### Pasos

1. Coloca todos los archivos en una carpeta en tu servidor web
2. Verifica que la estructura de carpetas sea correcta
3. Abre `index.html` en tu navegador
4. Asegúrate de que los archivos CSS y JS se cargan correctamente

### Para imágenes locales

- Coloca tus imágenes en la carpeta `images/`
- Actualiza las rutas en el HTML:
  ```html
  <img src="images/nombre-imagen.jpg" alt="Descripción" />
  ```

---

## 📝 Datos Personalizables

Puedes customizar fácilmente:

### Información de Contacto

- **Teléfono**: Busca `+57 300 123 4567` y reemplaza
- **Ubicación**: Busca `Marina Manzanillo` y reemplaza
- **Email**: Añade a las secciones de contacto

### Colores

Los colores principales están en `css/styles.css`:

- **Oro/Dorado**: `#d4af37` (premium)
- **Azul Marino**: `#0a192f` (profesional)

### Textos

Todos los textos pueden editarse directamente en los archivos HTML:

- Encabezados (h1, h2, h3)
- Párrafos (p)
- Listas (li)

### Imágenes

Las imágenes actualmente usan URLs de Unsplash. Para cambiarlas:

1. Reemplaza los URLs en `src="https://images.unsplash.com/..."`
2. O sube imágenes locales a la carpeta `images/`

---

## 🎯 SEO Básico

Cada página incluye:

- Meta descripciones relevantes
- Títulos descriptivos
- Estructura semántica correcta
- Alt text en imágenes

Personaliza los meta tags:

```html
<title>Tu Título | Cartagena Boat Detailing</title>
<meta name="description" content="Tu descripción" />
```

---

## 📱 Mobile-First Approach

El sitio está optimizado para móviles:

- Menú hamburguesa responsivo
- Imágenes adaptativas
- Text legible en pantallas pequeñas
- Footer comprimido en móviles
- Espaciado y tamaños ajustados

---

## 🔄 Animaciones Disponibles

### En CSS (`css/styles.css`)

- **fade-in**: Desvanecimiento con movimiento lateral
- **slide-in-left**: Desliza desde la izquierda
- **slide-in-right**: Desliza desde la derecha
- **scale-up**: Aparece con zoom
- **stagger-item**: Animación escalonada para listas
- **float**: Efecto flotante continuo
- **pulse-glow**: Destello pulsante

### Aplicar a elementos nuevos:

```html
<div class="fade-in">Contenido que aparece</div>
<div class="stagger-item">Ítem de lista</div>
```

---

## 💡 Tips de Mejora

### Para Mejorar Aún Más:

1. **Integración de formulario**: Conectar el formulario a un servicio de email (Formspree, EmailJS)
2. **Blog dinámico**: Crear posts como archivos separados o usar un CMS
3. **Galería de portafolio**: Añadir antes/después de trabajos realizados
4. **Sistema de reservas**: Integrar calendario de disponibilidad
5. **Analytics**: Añadir Google Analytics para tracking
6. **WhatsApp**: Botón flotante de WhatsApp para contacto directo

---

## 📞 Contacto y Soporte

Para cambios o mejoras, edita directamente los archivos HTML/CSS/JS según sea necesario.

---

**Version**: 1.0  
**Último actualizado**: Febrero 2024  
**Diseño**: Responsive, Mobile-First, Accessibility-Focused
