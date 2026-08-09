const quotes = [
  [
    "130",
    "Flota Gente de Mar",
    "Tres botes Firpol de 42 pies",
    "09 / 08 / 2026",
    "Pulido profesional de flota y servicios opcionales",
    "images/flota-firpol/rutas-mar-ii-vista.jpg"
  ],
  [
    "129",
    "Firulays Cristina",
    "Firpol de 42 pies ? Enrique Correa",
    "09 / 08 / 2026",
    "Pulido integral de gelcoat ? sistema 3M Marine",
    "images/firulays/firulays-5.jpg"
  ],
  [
    "128",
    "ORCHID",
    "Jet Speed Marine",
    "06 / 08 / 2026",
    "Reparaci?n de gelcoat y recuperaci?n de StarBoard",
    "../images/services/restauracion-gelcoat.webp"
  ],
  [
    "127",
    "Satori",
    "First Yacht 53 pies ? Jos? Luis Mora",
    "30 / 07 / 2026",
    "Pulido de acr?licos y acero inoxidable",
    "images/satori/satori%20(1).jpg"
  ],
  [
    "126",
    "Leyla",
    "Tuna 380 ? 38 pies",
    "24 / 07 / 2026",
    "Restauraci?n est?tica, acr?licos y parabrisas",
    "images/tuna-380/leyla%20(1).jpeg"
  ],
  [
    "125",
    "ORCHID",
    "Reparaci?n de gelcoat",
    "24 / 07 / 2026",
    "Correcci?n de rayones y golpe de proa",
    "../images/services/reparacion-fibra.webp"
  ],
  [
    "124",
    "SOLACE",
    "Yate de 43 pies ? Fabi?n Alberto Gallo Gordillo",
    "10 / 07 / 2026",
    "Pulido completo de casco y superestructura",
    "../images/brillo.webp"
  ],
  [
    "123",
    "Flota BPM Bol?var",
    "Dos lanchas bimotoras ? Carlos Echeverry",
    "09 / 07 / 2026",
    "Mantenimiento preventivo de motores Mercury",
    "../images/motores.webp"
  ],
  [
    "122",
    "Lancha de 28 pies",
    "Juan Jos? Silva",
    "02 / 07 / 2026",
    "Detailing completo interior y exterior",
    "../images/detailing.webp"
  ],
  [
    "121",
    "Juldor",
    "Regal de 26 pies ? Luis Ignacio Herrera",
    "02 / 07 / 2026",
    "Pulido integral de gelcoat ? sistema 3M Marine",
    "images/juldor/juldor%20(1).jpg"
  ],
  [
    "120",
    "Satori",
    "First Yacht 53 pies ? Jos? Luis Mora",
    "02 / 07 / 2026",
    "Pulido integral de gelcoat",
    "images/satori/satori%20(2).jpg"
  ],
  [
    "119",
    "Musiquita",
    "Boston Whaler 170 Super Sport ? Magin Ortiga",
    "02 / 07 / 2026",
    "Pulido, desmanchado y pintura de motor",
    "images/musiquita/musiquita%20(1).jpg"
  ],
  [
    "118",
    "Mavi Soul",
    "Catamar?n ? David Toro",
    "30 / 06 / 2026",
    "Pulido de acero inoxidable y gelcoat",
    "images/mavi-soul/mavisoul%20(1).jpg"
  ],
  [
    "117",
    "Kon-Tiki II",
    "Yate ? Sr. Ricardo",
    "26 / 06 / 2026",
    "Opciones de pintura exterior",
    "images/kon-tiki/kontiki%20(14).jpg"
  ],
  [
    "116",
    "Kon-Tiki II",
    "Yate ? Sr. Ricardo",
    "26 / 06 / 2026",
    "Diagn?stico y restauraci?n exterior",
    "images/kon-tiki/kontiki%20(1).jpg"
  ],
  [
    "115",
    "Suerte",
    "Sea Ray Sundancer 46 ? Manuel Zapata",
    "22 / 06 / 2026",
    "Cotizaci?n t?cnica de acabados y cubiertas",
    "../images/header%20(2).webp"
  ],
  [
    "114",
    "HAYA",
    "Azimut 46 pies ? actualizaci?n de proyecto",
    "20 / 06 / 2026",
    "Informe de avance y trabajos adicionales",
    "images/haya/HAYA%20(1).jpeg"
  ],
  [
    "113",
    "Leyla",
    "Tuna 380 ? 38 pies ? Shariff Tafur",
    "18 / 06 / 2026",
    "Pulido espejo y limpieza de cojiner?a",
    "images/tuna-380/leyla%20(2).jpeg"
  ],
  [
    "112",
    "Abbracci II",
    "Farid L?zaro",
    "10 / 06 / 2026",
    "Pintura de motor, caucho de borda y foam deck",
    "../images/services/pintura-motores.webp"
  ],
  [
    "111",
    "Travocatto",
    "Prestige 500 ? Fernando V?lez",
    "04 / 06 / 2026",
    "Restauraci?n integral de casco y cubierta",
    "../images/services/pintura-completa.webp"
  ],
  [
    "110",
    "ORCHID",
    "Jet Speed Marine",
    "26 / 05 / 2026",
    "Pulido de gelcoat y protecci?n de cojiner?a",
    "../images/services/pulido-gelcoat.webp"
  ],
  [
    "109",
    "Abbracci II",
    "Farid L?zaro",
    "26 / 05 / 2026",
    "Pulido integral de superficies y motor",
    "../images/polichado%20(2).webp"
  ],
  [
    "108",
    "Zeus III y Baby Shark",
    "Actualizaci?n de alcance ? Ing. Ximena",
    "25 / 05 / 2026",
    "Ajuste de trabajos de flota",
    "../images/cojineria%20(2).webp"
  ],
  [
    "107",
    "La Gracia de Dios 21",
    "Bravo de 41 pies",
    "21 / 05 / 2026",
    "Restauraci?n t?cnica de gelcoat y brillo",
    "images/gracia-de-dios-21/graciadedios%20(1).jpeg"
  ],
  [
    "106",
    "Zeus III y Baby Shark",
    "Flota Ing. Ximena",
    "21 / 05 / 2026",
    "Pulido, cojiner?a y adhesivos",
    "../images/polichado.webp"
  ],
  [
    "105",
    "HAYA",
    "Azimut 46 pies",
    "26 / 05 / 2026",
    "Proyecto integral de renovaci?n",
    "images/haya/HAYA%20(2).jpeg"
  ],
  [
    "104",
    "Mariaje",
    "Prestige 560 ? 56 pies",
    "16 / 05 / 2026",
    "Pulido integral total",
    "images/mariaje/mariaje-1.jpeg"
  ],
  [
    "103",
    "Life Journey",
    "Embarcaci?n de 65 pies ? Life Journey S.A.S.",
    "15 / 05 / 2026",
    "Pintura exterior integral",
    "images/san-andres/san%20andres%20(1).jpeg"
  ],
  [
    "102",
    "Sea Devil",
    "Sea Ray de 45 pies ? Ang?lica Oviedo",
    "13 / 05 / 2026",
    "Renovaci?n interior y exterior",
    "images/sea-devil/sea-devil-2.jpg"
  ],
  [
    "101",
    "Blue Freedom",
    "Bavaria 46 ? Sr. Alex",
    "07 / 05 / 2026",
    "Pulido integral de velero",
    "images/blue-freedom/bluefreedom%20(1).jpeg"
  ],
  [
    "100",
    "Nauta",
    "Velero de 55,5 pies ? Tol?",
    "07 / 05 / 2026",
    "Restauraci?n de gelcoat",
    "images/nauta/nauta%20(1).jpeg"
  ],
  [
    "099",
    "Roma",
    "Bote de 34 pies ? Miguel Guti?rrez",
    "07 / 05 / 2026",
    "Protecci?n PPF Full Armor 360?",
    "images/roma/roma-5.jpg"
  ],
  [
    "098",
    "Sea Devil",
    "Sea Ray de 45 pies ? Ang?lica Oviedo",
    "13 / 05 / 2026",
    "Pulido integral y protecci?n",
    "images/sea-devil/sea-devil-1.jpg"
  ],
  [
    "097",
    "Zeus III y Babys 1",
    "Flota Ing. Ximena",
    "21 / 05 / 2026",
    "Pulido y cojiner?a ? fase 1",
    "../images/cojineria.webp"
  ]
];

const cards = document.getElementById("cards");
cards.innerHTML = quotes
  .map(([number, name, subtitle, date, service, image]) => `
    <a class="card" href="cotizacion-${number}.html">
      <div class="card-image-wrap">
        <img class="card-image" src="${image}" alt="Embarcaci?n ${name}" loading="lazy" decoding="async"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
        <div class="card-image-placeholder" style="display:none">?</div>
        <span class="card-badge">CBD-2026-${number}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${name}</h3>
        <p class="card-subtitle">${subtitle}</p>
        <div class="card-divider"></div>
        <div class="card-meta">
          <div class="card-meta-row"><span class="label">No.</span><span class="value">CBD-2026-${number}</span></div>
          <div class="card-meta-row"><span class="label">Fecha</span><span class="value">${date}</span></div>
          <div class="card-meta-row"><span class="label">Servicio</span><span class="value">${service}</span></div>
        </div>
        <span class="card-cta">
          Ver cotizaci?n
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </div>
    </a>`)
  .join("");

document.getElementById("quote-count").textContent = quotes.length;
