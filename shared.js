(() => {
  const App = (() => {
    /*
      =========================================================
      CONSTANTES
      =========================================================
      Aquí dejamos “valores fijos” del proyecto:

      API_BASE:
      - Es la URL base de la PokeAPI. Luego le concatenamos endpoints como /pokemon/{id}.

      TTL_CACHE_MS:
      - TTL significa “Time To Live” (tiempo de vida).
      - Guardamos datos en caché por 24 horas para no pedir lo mismo muchas veces.
      - Buscamos el mismo Pokémon dos veces y
        vemos el badge “Desde caché”.
    */
const API_BASE = 'https://pokeapi.co/api/v2';
    const TTL_CACHE_MS = 24 * 60 * 60 * 1000; // 24 horas

    const CLAVES_STORAGE = {
      cachePokemon: 'pf_cache_pokemon',
      cacheHabilidad: 'pf_cache_habilidad',
      historico: 'pf_historico',
      favoritos: 'pf_favoritos',
    };
        /*
      =========================================================
      UTILIDADES (helpers)
      =========================================================
      Estas funciones no “hacen pantalla”, solo ayudan con tareas repetidas.
      Separarlas nos evita copiar/pegar lógica en muchas partes.
    */
const utils = {
      normalizarTexto(texto) {
        return String(texto ?? '').trim().toLowerCase();
      },
      capitalizar(texto) {
        const t = String(texto ?? '');
        if (!t) return t;
        return t.charAt(0).toUpperCase() + t.slice(1);
      },
      extraerIdDeUrl(url) {
        const partes = String(url).split('/').filter(Boolean);
        const ultimo = partes[partes.length - 1];
        const id = Number(ultimo);
        return Number.isFinite(id) ? id : null;
      },
      spritePorId(id) {
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
      },
      mapearNombreStat(nombreApi) {
        const mapa = {
          hp: 'HP',
          attack: 'ATTACK',
          defense: 'DEFENSE',
          'special-attack': 'SPECIAL-ATTACK',
          'special-defense': 'SPECIAL-DEFENSE',
          speed: 'SPEED',
        };
        return mapa[nombreApi] ?? nombreApi.toUpperCase();
      },
      formatearMultiplicador(x) {
        return Number(x).toFixed(2);
      },
    };

        /*
      =========================================================
      STORAGE (localStorage)
      =========================================================
      localStorage es un almacenamiento del navegador (clave/valor) que persiste,
      aunque cerremos la pestaña.

      Lo usamos para:
      1) Caché con TTL: guardar respuestas de la API y reutilizarlas.
      2) Histórico: lista de Pokémon buscados (persistente).
      3) Favoritos: lista de Pokémon marcados con corazón.
    */
const almacenamiento = {
      obtenerJSON(clave, valorPorDefecto) {
        // Intentamos leer un JSON de localStorage.
        // Si no existe o está corrupto, devolvemos un valor por defecto.
        // Esto evita que la app “se caiga” si alguien borra o rompe el storage manualmente.
        try {
          const texto = localStorage.getItem(clave);
          if (!texto) return valorPorDefecto;
          return JSON.parse(texto);
        } catch {
          return valorPorDefecto;
        }
      },
      guardarJSON(clave, valor) {
        localStorage.setItem(clave, JSON.stringify(valor));
      },

      /* -------------------------
         CACHÉ (con TTL)
      ------------------------- */
      leerCache(claveCache, claveItem) {
        /*
          Lectura de caché con TTL
          --------------------------------------------------------
          Estructura en localStorage (simplificada):
          {
            "pikachu": { fecha: 1700000000000, data: { ...respuesta API... } },
            "bulbasaur": { fecha: 1700000001000, data: { ... } }
          }

          Estados que devolvemos:
          - miss     : no hay nada guardado aún.
          - cache    : hay dato y todavía NO venció (sirve directo).
          - expired  : hay dato pero venció; lo podemos mostrar como “vencido”,
                      y luego la app vuelve a pedir a la API para refrescar.
        */
        const cache = this.obtenerJSON(claveCache, {});
        const item = cache[claveItem];

        if (!item) {
          return { estado: 'miss', data: null };
        }

        const ahora = Date.now();
        const expiro = (ahora - item.fecha) > TTL_CACHE_MS;

        if (expiro) {
          return { estado: 'expired', data: item.data };
        }

        return { estado: 'cache', data: item.data };
      },
      escribirCache(claveCache, claveItem, data) {
        const cache = this.obtenerJSON(claveCache, {});
        cache[claveItem] = { fecha: Date.now(), data };
        this.guardarJSON(claveCache, cache);
      },
      limpiarCacheCompleta() {
        localStorage.removeItem(CLAVES_STORAGE.cachePokemon);
        localStorage.removeItem(CLAVES_STORAGE.cacheHabilidad);
      },

      /* -------------------------
         HISTÓRICO
      ------------------------- */
      obtenerHistorico() {
        return this.obtenerJSON(CLAVES_STORAGE.historico, []);
      },
      guardarHistorico(lista) {
        this.guardarJSON(CLAVES_STORAGE.historico, lista);
      },
      agregarAlHistorico(pokemonMini) {
        // Evito duplicados: si existe, lo saco y lo pongo arriba
        const lista = this.obtenerHistorico();
        const filtrado = lista.filter(x => x.id !== pokemonMini.id);
        filtrado.unshift(pokemonMini);
        this.guardarHistorico(filtrado);
      },
      eliminarDelHistorico(idPokemon) {
        const lista = this.obtenerHistorico().filter(x => x.id !== idPokemon);
        this.guardarHistorico(lista);
      },
      limpiarHistorico() {
        localStorage.removeItem(CLAVES_STORAGE.historico);
      },

      /* -------------------------
         FAVORITOS
      ------------------------- */
      obtenerFavoritos() {
        return this.obtenerJSON(CLAVES_STORAGE.favoritos, []);
      },
      guardarFavoritos(lista) {
        this.guardarJSON(CLAVES_STORAGE.favoritos, lista);
      },
      esFavorito(idPokemon) {
        return this.obtenerFavoritos().some(x => x.id === idPokemon);
      },
      alternarFavorito(pokemonMini) {
        const lista = this.obtenerFavoritos();
        const yaExiste = lista.some(x => x.id === pokemonMini.id);

        const nuevaLista = yaExiste
          ? lista.filter(x => x.id !== pokemonMini.id)
          : [pokemonMini, ...lista];

        this.guardarFavoritos(nuevaLista);
        return !yaExiste;
      },
      eliminarFavorito(idPokemon) {
        const lista = this.obtenerFavoritos().filter(x => x.id !== idPokemon);
        this.guardarFavoritos(lista);
      },
      limpiarFavoritos() {
        localStorage.removeItem(CLAVES_STORAGE.favoritos);
      },
    };
        /*
      =========================================================
      API (fetch + async/await)
      =========================================================
      Aquí concentramos las llamadas HTTP a la PokeAPI.
    */
const api = {
      async pedirJSON(url) {
        // Hacemos la petición y validamos que resp.ok sea true.
        // Si no, lanzamos un error para que la página muestre el mensaje “no encontrado”.
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return resp.json();
      },

      async obtenerPokemon(nombreOId) {
        /*
          Flujo de obtención de Pokémon
          1) Normalizamos el texto: (trim + lower) para evitar fallos por espacios/mayúsculas.
          2) Revisamos caché localStorage: si está vigente, devolvemos origen='cache'.
          3) Si no está, pedimos a la API y guardamos el resultado en caché.
          4) Devolvemos también el “origen” para el badge visual (API / Caché / Vencido).
        */
        const q = utils.normalizarTexto(nombreOId);
        const clave = q;

        const cache = almacenamiento.leerCache(CLAVES_STORAGE.cachePokemon, clave);
        if (cache.estado === 'cache') return { origen: 'cache', data: cache.data };

        const data = await this.pedirJSON(`${API_BASE}/pokemon/${encodeURIComponent(q)}`);
        almacenamiento.escribirCache(CLAVES_STORAGE.cachePokemon, clave, data);

        const origen = (cache.estado === 'expired') ? 'expired' : 'api';
        return { origen, data };
      },

      async obtenerHabilidad(nombreOId) {
        // Igual que obtenerPokemon, pero consultando el endpoint /ability/{name}.
        // También guardamos en su caché separado para no mezclar datos distintos.
        const q = utils.normalizarTexto(nombreOId);
        const clave = q;

        const cache = almacenamiento.leerCache(CLAVES_STORAGE.cacheHabilidad, clave);
        if (cache.estado === 'cache') return { origen: 'cache', data: cache.data };

        const data = await this.pedirJSON(`${API_BASE}/ability/${encodeURIComponent(q)}`);
        almacenamiento.escribirCache(CLAVES_STORAGE.cacheHabilidad, clave, data);

        const origen = (cache.estado === 'expired') ? 'expired' : 'api';
        return { origen, data };
      },

      async obtenerEspecie(nombreOId) {
        const q = utils.normalizarTexto(nombreOId);
        return this.pedirJSON(`${API_BASE}/pokemon-species/${encodeURIComponent(q)}`);
      },

      async obtenerCadenaEvolutivaPorUrl(urlCadena) {
        return this.pedirJSON(urlCadena);
      },
    };

        /*
      =========================================================
      TEMPLATES (generación de HTML)
      =========================================================
      En vez de crear elementos con document.createElement(),
      generamos HTML con strings (template literals).
    */
const templates = {
      badgeOrigen(origen) {
        if (origen === 'cache') return `<span class="badge cache">Desde caché</span>`;
        if (origen === 'expired') return `<span class="badge expired">Caché vencido</span>`;
        return `<span class="badge api">Desde API</span>`;
      },

      chipsTipos(tipos) {
        return tipos.map(t => `<span class="chip tipo">${t.toUpperCase()}</span>`).join('');
      },

      chipsHabilidades(habilidades) {
        /*
          Cada habilidad se dibuja como <button> (no como <span>).
          - data-accion="buscar-habilidad" nos dice QUÉ quiere hacer el usuario.
          - data-buscar="static" nos dice QUÉ texto debemos buscar.
          Después, en la página Buscar, capturamos el click con delegación (un solo listener). 
        */
        // Cada habilidad es un botón (clickeable) que manda a buscar la habilidad
        return habilidades.map(h => `
          <button
            class="chip clickeable habilidad ${h.oculta ? 'oculta' : ''}"
            data-accion="buscar-habilidad"
            data-buscar="${h.nombre}"
            type="button"
            title="Ver información de la habilidad"
          >
            ${utils.capitalizar(h.etiqueta)}
          </button>
        `).join('');
      },

      stats(pokemonApi) {
        const MAX = 255;
        return pokemonApi.stats.map(s => {
          const nombre = utils.mapearNombreStat(s.stat.name);
          const valor = s.base_stat;
          const porcentaje = Math.min(100, Math.round((valor / MAX) * 100));
          return `
            <div class="nombre">${nombre}:</div>
            <div class="barra"">
              <div class="relleno" style="width:${porcentaje}%"></div>
            </div>
          `;
        }).join('');
      },

      tarjetaPokemon({ pokemonApi, origen, evolucionHtml, esFavorito }) {
        /*
          Tarjeta principal del Pokémon
          pintamos:
          - Badge de origen (API / Caché / Vencido).
          - Sprite, nombre, tipos.
          - Habilidades (clickeables).
          - Stats con barras.
          - Corazón de favorito (presionado si ya está en favoritos).
          - Cadena de evolución (HTML que construimos en el módulo evolucion).

          data-id y data-nombre en <article> nos ayudan a recuperar el Pokémon
          cuando hacemos click en el corazón (sin buscar de nuevo en la API).
        */
        const id = pokemonApi.id;
        const nombre = pokemonApi.name.toUpperCase();
        const sprite = pokemonApi.sprites?.front_default || utils.spritePorId(id);
        const tipos = pokemonApi.types.map(x => x.type.name);

        // Armamos un objeto por habilidad para poder mostrar (Oculta) pero buscar con el nombre real
        const habilidades = pokemonApi.abilities.map(a => ({
          nombre: a.ability.name,
          etiqueta: a.is_hidden ? `${a.ability.name} (Oculta)` : a.ability.name,
          oculta: a.is_hidden
        }));

        return `
          <article class="tarjeta" data-id="${id}" data-nombre="${pokemonApi.name}">
            <div class="tarjeta-head">
              <span class="etiqueta-negra">pokemon_data</span>
              ${templates.badgeOrigen(origen)}
            </div>

            <div class="sprite-cuadro">
              <img src="${sprite}" alt="${pokemonApi.name}" />
            </div>

            <h2 class="titulo-pokemon">#${id} ${nombre}</h2>
            <div class="linea"></div>

            <div class="chips">${templates.chipsTipos(tipos)}</div>

            <div class="linea"></div>

            <div style="font-weight:900; text-transform:uppercase; margin-bottom:8px;">Habilidades</div>
            <div class="chips">${templates.chipsHabilidades(habilidades)}</div>

            <div class="stats">${templates.stats(pokemonApi)}</div>

            <div class="zona-corazon">
              <button class="btn-corazon ${esFavorito ? 'activo' : ''}" data-accion="toggle-favorito" type="button">
                ❤️
              </button>
            </div>

            <div class="separador-punteado"></div>
            <div class="titulo-seccion">Cadena de evolución</div>

            ${evolucionHtml}
          </article>
        `;
      },

      evolucionVacia() {
        return `<div class="mensaje">No se pudo cargar la cadena evolutiva.</div>`;
      },

      evolucionLinea(itemsHtml) {
        return `<div class="evolucion">${itemsHtml}</div>`;
      },

      evoItem({ id, nombre, activo }) {
        const sprite = utils.spritePorId(id);
        return `
          <button class="evo-item ${activo ? 'activo' : ''}" data-accion="buscar-pokemon" data-buscar="${nombre}" type="button">
            <img src="${sprite}" alt="${nombre}">
            <div>${nombre.toUpperCase()}</div>
          </button>
        `;
      },

      flecha(textoCondicion) {
        const texto = String(textoCondicion ?? '').trim();

        return `
          <div class="evo-flecha">
            ${texto ? `<div class="evo-cond">${texto}</div>` : ''}
            <div class="evo-icon">→</div>
          </div>
        `;
      },

      mensajeCargando(texto) {
        return `<div class="mensaje cargando">⏳ ${texto}</div>`;
      },

      mensajeError(texto) {
        return `<div class="mensaje error">❌ ${texto}</div>`;
      },

      /* Habilidad */
      tarjetaHabilidad({ habilidadApi, origen }) {
        const nombre = habilidadApi.name.toUpperCase();

        const entradaEs = habilidadApi.effect_entries.find(e => e.language.name === 'es');
        const entradaEn = habilidadApi.effect_entries.find(e => e.language.name === 'en');
        const descripcion = (entradaEs?.short_effect || entradaEs?.effect || entradaEn?.short_effect || entradaEn?.effect || 'Sin descripción.');

        const lista = habilidadApi.pokemon
          .slice(0, 50)
          .map(p => {
            const nombreP = p.pokemon.name;
            const id = utils.extraerIdDeUrl(p.pokemon.url);
            const sprite = id ? utils.spritePorId(id) : '';
            return `
              <button class="chip clickeable" data-accion="buscar-pokemon" data-buscar="${nombreP}" type="button" title="Buscar Pokémon">
                ${sprite ? `<img src="${sprite}" alt="${nombreP}" style="width:22px;height:22px;image-rendering:pixelated;vertical-align:middle;margin-right:6px;">` : ''}
                ${nombreP.toUpperCase()}
              </button>
            `;
          }).join('');

        return `
          <article class="tarjeta">
            <div class="tarjeta-head">
              <span class="etiqueta-negra">ability_data</span>
              ${templates.badgeOrigen(origen)}
            </div>

            <h2 class="titulo-pokemon">✨ ${nombre}</h2>
            <div class="linea"></div>

            <div class="mensaje">${descripcion}</div>

            <div class="linea"></div>
            <div style="font-weight:900; text-transform:uppercase; margin-bottom:8px;">
              Pokémon con esta habilidad
            </div>
            <div class="chips">${lista || '<span class="chip">Sin lista</span>'}</div>
          </article>
        `;
      },

      /* Listas */
      itemLista({ pokemonMini, mostrarBotonFavorito }) {
        const tipos = templates.chipsTipos(pokemonMini.tipos || []);

        // En Histórico sí mostramos el corazón. Y aquí decidimos si debe verse “presionado”
        // dependiendo de si ese Pokémon ya está en favoritos.
        const esFav = mostrarBotonFavorito ? almacenamiento.esFavorito(pokemonMini.id) : false;

        const corazon = mostrarBotonFavorito ? `
          <button class="btn-cuadro ${esFav ? 'activo' : ''}" data-accion="toggle-favorito" type="button">❤️</button>
        ` : '';

        return `
          <article class="item-lista" data-id="${pokemonMini.id}" data-nombre="${pokemonMini.nombre}">
            <div class="mini">
              <img src="${pokemonMini.sprite}" alt="${pokemonMini.nombre}">
            </div>

            <div class="info">
              <p class="nombre">#${pokemonMini.id} ${pokemonMini.nombre.toUpperCase()}</p>
              <div class="chips">${tipos}</div>
            </div>

            <div class="acciones">
              ${corazon}
              <button class="btn-cuadro rojo" data-accion="eliminar-item" type="button">🗑️</button>
            </div>
          </article>
        `;
      },

      vistaVacia({ titulo, subtitulo }) {
        if (titulo === "No hay pokémones en el histórico"){
          return `
          <div class="vacio">
            <div style="font-size:44px;">📜</div>
            <h2>${titulo}</h2>
            <p>${subtitulo}</p>
          </div>
        `;
        }
        else {
          return `
          <div class="vacio">
            <div style="font-size:44px;">❤️</div>
            <h2>${titulo}</h2>
            <p>${subtitulo}</p>
          </div>
        `;
        }

      },

      /* VS */
      vsCartasVacias() {
        return `
          <div class="vs-carta vacia">?</div>
          <div style="text-align:center;font-weight:900;">⚔️</div>
          <div class="vs-carta vacia">?</div>
        `;
      },

      vsPanelVacio() {
        return `<div class="panel-vs-vacio"><div style="font-size:64px;">⚔️</div></div>`;
      },

      vsCartaPokemon({ pokemonApi, puntos, ganador, origen }) {
        const tiposPokemon = pokemonApi.types.map(x => x.type.name);
        const sprite = pokemonApi.sprites?.front_default || utils.spritePorId(pokemonApi.id);

        return `
          <div class="vs-carta ${ganador ? 'ganador' : ''}" data-id="${pokemonApi.id}" data-nombre="${pokemonApi.name}">
            <div class="tarjeta-head" style="margin-bottom:10px;">
              <span class="etiqueta-negra">pokemon_data</span>
              ${origen ? templates.badgeOrigen(origen) : ''}
            </div>

            ${ganador ? `<div class="chip" style="display:inline-flex; gap:8px; align-items:center; background:var(--color-accent);">🏆 GANADOR</div>` : ''}

            <div style="margin:10px 0;">
              <img src="${sprite}" alt="${pokemonApi.name}" style="width:70px;height:70px;image-rendering:pixelated;">
            </div>

            <div style="font-weight:900; text-transform:uppercase;">${pokemonApi.name}</div>

            <div class="chips" style="justify-content:center;margin-top:8px;">
              ${templates.chipsTipos(tiposPokemon)}
            </div>

            <div class="pts">${Number(puntos).toFixed(1)} pts</div>

            <div class="zona-corazon">
              <button class="btn-corazon ${almacenamiento.esFavorito(pokemonApi.id) ? 'activo' : ''}"
                data-accion="toggle-favorito" type="button">❤️</button>
            </div>
          </div>
        `;
      },


      bloqueVentajasTipo({ linea1, linea2 }) {
        return `
          <div class="bloque">
            <h3>⚡ Ventajas de tipo</h3>
            <div class="alerta roja">${linea1}</div>
            <div class="alerta verde">${linea2}</div>
          </div>
        `;
      },

      bloqueComparacionStats({ stats1, stats2 }) {
        const orden = [
          { key: 'hp', label: 'HP' },
          { key: 'attack', label: 'ATK' },
          { key: 'defense', label: 'DEF' },
          { key: 'special-attack', label: 'SP.ATK' },
          { key: 'special-defense', label: 'SP.DEF' },
          { key: 'speed', label: 'SPD' },
        ];

        const filas = orden.map(s => {
          const v1 = stats1[s.key] ?? 0;
          const v2 = stats2[s.key] ?? 0;
          const max = Math.max(v1, v2, 1);
          const p1 = Math.round((v1 / max) * 100);
          const p2 = Math.round((v2 / max) * 100);

          return `
            <div class="fila-stat-vs">
              <div style="font-weight:900;color:#ff3b3b;">${v1}</div>
              <div class="barra-vs">
                <div class="izq" style="width:${p1}%"></div>
                <div class="der" style="width:${p2}%"></div>
              </div>
              <div class="etiqueta-centro">${s.label}</div>
              <div style="font-weight:900;color:#ff3b3b;">${v2}</div>
            </div>
          `;
        }).join('');

        return `
          <div class="bloque">
            <h3>📈 Comparación de stats</h3>
            <div class="filas-stats-vs">${filas}</div>
          </div>
        `;
      },

      bloqueCalculo({ base1, base2, mult1, mult2, final1, final2, n1, n2 }) {
        return `
          <div class="bloque">
            <h3>🧮 Cálculo del puntaje</h3>
            <div style="font-weight:700;">
              Stats Base Total: ${n1}: ${base1} | ${n2}: ${base2}<br>
              Multiplicador de Tipo: ${n1}: x${utils.formatearMultiplicador(mult1)} | ${n2}: x${utils.formatearMultiplicador(mult2)}<br>
              Puntaje Final: ${n1}: ${final1.toFixed(1)} | ${n2}: ${final2.toFixed(1)}
            </div>
          </div>
        `;
      },
    };

        /*
      =========================================================
      EVOLUCIÓN (Cadena evolutiva)
      =========================================================
      La PokeAPI devuelve la evolución como un “árbol” (tree):
      - Un nodo base (ej: pichu)
      - evolves_to con uno o varios hijos (ej: pikachu)
      - y esos hijos a su vez pueden tener más hijos (ej: raichu)

      Segun el video del profe, el quería:
      - Mostrar sprites de cada etapa.
      - Si hay ramificaciones, mostrar una sola flecha y “resumir” condiciones.
      Por eso convertimos ese árbol a “niveles” (etapas 1,2,3...). 
    */
const evolucion = {
      nombreBonito(nombreApi) {
        // Convierto "thunder-stone" -> "THUNDER STONE"
        return String(nombreApi ?? '').replaceAll('-', ' ').toUpperCase();
      },

      etiquetaCondicionEvolucion(detalle) {
        if (!detalle) return 'EVOLUCIÓN';

        const trigger = detalle.trigger?.name;

        // Caso común: subir de nivel
        if (trigger === 'level-up') {
          const partes = [];

          if (detalle.min_level) partes.push(`LVL ${detalle.min_level}`);
          else partes.push('SUBIR NIVEL');

          if (detalle.min_happiness) partes.push(`FELICIDAD ${detalle.min_happiness}+`);
          if (detalle.min_affection) partes.push(`AFECTO ${detalle.min_affection}+`);

          if (detalle.time_of_day) {
            const t = detalle.time_of_day;
            if (t === 'day') partes.push('DÍA');
            else if (t === 'night') partes.push('NOCHE');
            else partes.push(t.toUpperCase());
          }

          if (detalle.location?.name) partes.push(`LUGAR ${this.nombreBonito(detalle.location.name)}`);

          return partes.join(' • ');
        }

        // Usar ítem (piedras, etc.)
        if (trigger === 'use-item') {
          if (detalle.item?.name) return `USAR ${this.nombreBonito(detalle.item.name)}`;
          return 'USAR ÍTEM';
        }

        // Intercambio
        if (trigger === 'trade') {
          if (detalle.held_item?.name) return `INTERCAMBIO CON ${this.nombreBonito(detalle.held_item.name)}`;
          if (detalle.trade_species?.name) return `INTERCAMBIO POR ${this.nombreBonito(detalle.trade_species.name)}`;
          return 'INTERCAMBIO';
        }

        // Otros triggers (por si sale algo raro)
        let base = trigger ? trigger.replaceAll('-', ' ').toUpperCase() : 'EVOLUCIÓN';

        // Si viene item aunque el trigger no sea "use-item"
        if (detalle.item?.name) base += ` ${this.nombreBonito(detalle.item.name)}`;

        return base;
      },

      resumirEtiquetas(etiquetas) {
        const limpias = (etiquetas || [])
          .map(x => String(x ?? '').trim())
          .filter(Boolean);

        if (limpias.length === 0) return 'EVOLUCIÓN';

        const unicas = [...new Set(limpias)];

        if (unicas.length === 1) return unicas[0];

        // Si hay varias condiciones (ramificaciones), muestro un resumen
        const max = 3;
        const primeras = unicas.slice(0, max);
        const resto = unicas.length - primeras.length;

        return resto > 0
          ? `${primeras.join(' | ')} +${resto}`
          : primeras.join(' | ');
      },

      renderizarCadena(cadenaApi, nombrePokemonActual) {
        /*
          Estrategia que usamos
          1) Tomamos la raíz: cadenaApi.chain.
          2) Construimos niveles (arrays):
             nivel 0: [raíz]
             nivel 1: [hijos de raíz]
             nivel 2: [nietos], etc.
          3) Al mismo tiempo guardamos las condiciones (evolution_details) de cada transición.
          4) Dibujamos: nivel -> flecha resumen -> nivel -> flecha -> nivel...
        */
        try {
          const raiz = cadenaApi.chain;

          // Niveles para: etapa 1 -> etapa 2 -> etapa 3...
          const niveles = [];
          // flechas[i] guarda las condiciones entre niveles[i] y niveles[i+1]
          const flechas = [];

          let nivelActual = [raiz];

          while (nivelActual.length > 0) {
            niveles.push(nivelActual);

            const siguiente = [];
            const condicionesTransicion = [];

            // Aquí recolectamos tanto el siguiente nivel como las condiciones
            for (const nodo of nivelActual) {
              for (const hijo of nodo.evolves_to) {
                siguiente.push(hijo);

                // La condición viene en el hijo (evolution_details)
                const detalle = hijo.evolution_details?.[0];
                const etiqueta = this.etiquetaCondicionEvolucion(detalle);
                condicionesTransicion.push(etiqueta);
              }
            }

            flechas.push(condicionesTransicion);
            nivelActual = siguiente;
          }

          let html = '';

          for (let i = 0; i < niveles.length; i++) {
            const nodos = niveles[i];

            const items = nodos.map(n => {
              const id = utils.extraerIdDeUrl(n.species.url);
              const nombre = n.species.name;
              const activo = (nombre === nombrePokemonActual);
              return templates.evoItem({ id, nombre, activo });
            }).join('');

            html += items;

            // Agregamos una sola flecha por nivel.
            // pero mostrando un resumen de condiciones si hay ramificaciones.
            if (i < niveles.length - 1) {
              const condiciones = flechas[i] || [];
              const textoCondicion = this.resumirEtiquetas(condiciones);
              html += templates.flecha(textoCondicion);
            }
          }

          return templates.evolucionLinea(html);
        } catch {
          return templates.evolucionVacia();
        }
      },
    };

        /*
      =========================================================
      TIPOS (VS Battle)
      =========================================================
      Para el modo VS, el profesor pidió una lógica “simple” de efectividad.

      No simulamos una batalla real completa.
      Solo hacemos:
      - Sumatoria de stats base (HP + ATK + DEF + SPATK + SPDEF + SPD)
      - Multiplicador por tipo (2x, 0.5x, 0x, 1x)
      - Puntaje final = statsBaseTotal * multiplicador
    */
const tipos = {
      tabla: {
        normal:   { super: [], not: ['rock','steel'], none: ['ghost'] },
        fire:     { super: ['grass','ice','bug','steel'], not: ['fire','water','rock','dragon'], none: [] },
        water:    { super: ['fire','ground','rock'], not: ['water','grass','dragon'], none: [] },
        electric: { super: ['water','flying'], not: ['electric','grass','dragon'], none: ['ground'] },
        grass:    { super: ['water','ground','rock'], not: ['fire','grass','poison','flying','bug','dragon','steel'], none: [] },
        ice:      { super: ['grass','ground','flying','dragon'], not: ['fire','water','ice','steel'], none: [] },
        fighting: { super: ['normal','ice','rock','dark','steel'], not: ['poison','flying','psychic','bug','fairy'], none: ['ghost'] },
        poison:   { super: ['grass','fairy'], not: ['poison','ground','rock','ghost'], none: ['steel'] },
        ground:   { super: ['fire','electric','poison','rock','steel'], not: ['grass','bug'], none: ['flying'] },
        flying:   { super: ['grass','fighting','bug'], not: ['electric','rock','steel'], none: [] },
        psychic:  { super: ['fighting','poison'], not: ['psychic','steel'], none: ['dark'] },
        bug:      { super: ['grass','psychic','dark'], not: ['fire','fighting','poison','flying','ghost','steel','fairy'], none: [] },
        rock:     { super: ['fire','ice','flying','bug'], not: ['fighting','ground','steel'], none: [] },
        ghost:    { super: ['psychic','ghost'], not: ['dark'], none: ['normal'] },
        dragon:   { super: ['dragon'], not: ['steel'], none: ['fairy'] },
        dark:     { super: ['psychic','ghost'], not: ['fighting','dark','fairy'], none: [] },
        steel:    { super: ['ice','rock','fairy'], not: ['fire','water','electric','steel'], none: [] },
        fairy:    { super: ['fighting','dragon','dark'], not: ['fire','poison','steel'], none: [] },
      },

      multiplicador(tipoAtacante, tiposDefensor) {
        /*
          tiposDefensor puede tener 1 o 2 tipos (ej: water/flying).
          Por eso aplicamos el multiplicador por CADA tipo y multiplicamos el resultado.
          Ejemplo:
            atacante electric vs defensor [water, flying]
            electric es 2x contra water y 2x contra flying => 2 * 2 = 4x
        */
        const t = this.tabla[tipoAtacante];
        if (!t) return 1;

        let mult = 1;
        for (const td of tiposDefensor) {
          if (t.none.includes(td)) mult *= 0;
          else if (t.super.includes(td)) mult *= 2;
          else if (t.not.includes(td)) mult *= 0.5;
        }
        return mult;
      },

      explicar(tipoAtacante, tipoDefensor, mult) {
        if (mult === 0) return `${tipoAtacante} no afecta a ${tipoDefensor}`;
        if (mult > 1) return `${tipoAtacante} es súper efectivo contra ${tipoDefensor}`;
        if (mult < 1) return `${tipoAtacante} es poco efectivo contra ${tipoDefensor}`;
        return `${tipoAtacante} es neutral contra ${tipoDefensor}`;
      }
    };

        /*
      =========================================================
      PÁGINAS
      =========================================================
      Nuestro proyecto tiene 4 páginas HTML, pero un solo JS.
      ¿Cómo sabe el JS qué lógica usar?
      - En cada <body> pusimos data-pagina="buscar|historico|favoritos|vs".
      - En init() leemos document.body.dataset.pagina y ejecutamos solo ese módulo.
    */
const paginas = {
      buscar: {
        html: {},
        init() {
          this.html = {
            form: document.querySelector('#form-buscar'),
            selectTipo: document.querySelector('#tipo-busqueda'),
            inputTexto: document.querySelector('#texto-busqueda'),
            zonaMensajes: document.querySelector('#zona-mensajes'),
            resultado: document.querySelector('#resultado'),
          };

          this.html.form.addEventListener('submit', (e) => this.handlers.onSubmit(e));

          // Delegación: botones dentro del resultado (favorito, evoluciones, habilidad, etc.)
          this.html.resultado.addEventListener('click', (e) => this.handlers.onResultadoClick(e));
          // Delegación de eventos:
          // En vez de poner un addEventListener a cada botón creado dinámicamente,
          // escuchamos un solo click en el contenedor (#resultado).
          // Luego buscamos cuál botón fue el que se presionó con e.target.closest('[data-accion]').

          const params = new URLSearchParams(location.search);
          const q = params.get('q');
          const tipo = params.get('tipo');

          if (tipo === 'habilidad') {
            this.html.selectTipo.value = 'habilidad';
            this.handlers.ajustarPlaceholder();
          } else {
            this.html.selectTipo.value = 'pokemon';
            this.handlers.ajustarPlaceholder();
          }

          this.html.selectTipo.addEventListener('change', () => this.handlers.ajustarPlaceholder());

          if (q) {
            this.html.inputTexto.value = q;
            this.buscarAhora();
          }
        },

        handlers: {
          ajustarPlaceholder() {
            const select = paginas.buscar.html.selectTipo;
            const input = paginas.buscar.html.inputTexto;

            input.placeholder = (select.value === 'habilidad')
              ? 'NOMBRE O ID DE HABILIDAD...'
              : 'NOMBRE O ID...';
          },

          async onSubmit(e) {
            e.preventDefault();
            await paginas.buscar.buscarAhora();
          },

          async onResultadoClick(e) {
            const boton = e.target.closest('[data-accion]');
            if (!boton) return;

            const accion = boton.dataset.accion;

            if (accion === 'toggle-favorito') {
                // En histórico, el corazón vive dentro del item de lista.
                // Alternamos el favorito en storage y, además, cambiamos el estilo del botón
                // para que se vea “presionado” en esa misma tarjeta.
              const tarjeta = e.target.closest('[data-id]');
              if (!tarjeta) return;

              const id = Number(tarjeta.dataset.id);
              const nombre = tarjeta.dataset.nombre;

              const pokemonMini = {
                id,
                nombre,
                sprite: utils.spritePorId(id),
                tipos: paginas.buscar._tiposActuales || []
              };

              const ahoraEsFav = almacenamiento.alternarFavorito(pokemonMini);
              boton.classList.toggle('activo', ahoraEsFav);
              return;
            }

            if (accion === 'buscar-pokemon') {
              const nombreBuscar = boton.dataset.buscar;
              if (!nombreBuscar) return;

              paginas.buscar.html.selectTipo.value = 'pokemon';
              this.ajustarPlaceholder();
              paginas.buscar.html.inputTexto.value = nombreBuscar;

              await paginas.buscar.buscarAhora();
              return;
            }

            if (accion === 'buscar-habilidad') {
              const habilidadBuscar = boton.dataset.buscar;
              if (!habilidadBuscar) return;

              paginas.buscar.html.selectTipo.value = 'habilidad';
              this.ajustarPlaceholder();
              paginas.buscar.html.inputTexto.value = habilidadBuscar;

              await paginas.buscar.buscarAhora();
            }
          }
        },

        _tiposActuales: [],

        async buscarAhora() {
          const tipoBusqueda = this.html.selectTipo.value;
          const texto = utils.normalizarTexto(this.html.inputTexto.value);

          this.html.resultado.innerHTML = '';
          this.html.zonaMensajes.innerHTML = '';

          if (!texto) {
            this.html.zonaMensajes.innerHTML = templates.mensajeError('Escribe un nombre o ID.');
            return;
          }

          try {
            this.html.zonaMensajes.innerHTML = templates.mensajeCargando('Buscando...');
            if (tipoBusqueda === 'habilidad') {
              await this._buscarHabilidad(texto);
            } else {
              await this._buscarPokemon(texto);
            }
          } catch {
            this.html.zonaMensajes.innerHTML = templates.mensajeError('No se pudo completar la búsqueda.');
          }
        },

        async _buscarPokemon(texto) {
          try {
            const { origen, data: pokemonApi } = await api.obtenerPokemon(texto);

            this._tiposActuales = pokemonApi.types.map(x => x.type.name);

            const pokemonMini = {
              id: pokemonApi.id,
              nombre: pokemonApi.name,
              sprite: pokemonApi.sprites?.front_default || utils.spritePorId(pokemonApi.id),
              tipos: pokemonApi.types.map(x => x.type.name),
            };

            almacenamiento.agregarAlHistorico(pokemonMini);

            let evolucionHtml = templates.evolucionVacia();
            try {
              const especie = await api.obtenerEspecie(pokemonApi.id);
              const cadena = await api.obtenerCadenaEvolutivaPorUrl(especie.evolution_chain.url);
              evolucionHtml = evolucion.renderizarCadena(cadena, pokemonApi.name);
            } catch {
              evolucionHtml = templates.evolucionVacia();
            }

            const esFav = almacenamiento.esFavorito(pokemonApi.id);

            this.html.zonaMensajes.innerHTML = '';
            this.html.resultado.innerHTML = templates.tarjetaPokemon({
              pokemonApi,
              origen,
              evolucionHtml,
              esFavorito: esFav,
            });
          } catch {
            this.html.zonaMensajes.innerHTML = templates.mensajeError('Pokémon no encontrado.');
          }
        },

        async _buscarHabilidad(texto) {
          try {
            const { origen, data: habilidadApi } = await api.obtenerHabilidad(texto);
            this.html.zonaMensajes.innerHTML = '';
            this.html.resultado.innerHTML = templates.tarjetaHabilidad({ habilidadApi, origen });
          } catch {
            this.html.zonaMensajes.innerHTML = templates.mensajeError('Habilidad no encontrada.');
          }
        },
      },

      historico: {
        html: {},
        init() {
          this.html = {
            lista: document.querySelector('#lista-historico'),
            btnLimpiar: document.querySelector('#btn-limpiar-historico'),
          };

          this.render();
          this.html.lista.addEventListener('click', (e) => this.handlers.onListaClick(e));
          this.html.btnLimpiar.addEventListener('click', () => this.handlers.onLimpiarTodo());
        },

        render() {
          const lista = almacenamiento.obtenerHistorico();

          if (lista.length === 0) {
            this.html.lista.innerHTML = templates.vistaVacia({
              titulo: 'No hay pokémones en el histórico',
              subtitulo: 'Busca un pokémon para agregarlo aquí',
            });
            return;
          }

          this.html.lista.innerHTML = lista.map(p => templates.itemLista({
            pokemonMini: p,
            mostrarBotonFavorito: true
          })).join('');
        },

        handlers: {
          onListaClick(e) {
            const botonAccion = e.target.closest('[data-accion]');
            const item = e.target.closest('.item-lista');
            if (!item) return;

            const id = Number(item.dataset.id);
            const nombre = item.dataset.nombre;

            if (botonAccion) {
              const accion = botonAccion.dataset.accion;

              if (accion === 'toggle-favorito') {
                const pokemonMini = almacenamiento.obtenerHistorico().find(x => x.id === id);
                if (!pokemonMini) return;

                // alternarFavorito me devuelve true si ahora quedó en favoritos, o false si se quitó.
                const ahoraEsFav = almacenamiento.alternarFavorito(pokemonMini);

                // Actualizo el color “presionado” del corazón SOLO en esta tarjeta.
                botonAccion.classList.toggle('activo', ahoraEsFav);
                return;
              }

              if (accion === 'eliminar-item') {
                almacenamiento.eliminarDelHistorico(id);
                paginas.historico.render();
                return;
              }
            }

            location.href = `index.html?q=${encodeURIComponent(nombre)}&tipo=pokemon`;
          },

          onLimpiarTodo() {
            const ok = confirm('¿Seguro que quieres limpiar el histórico y la caché?');
            if (!ok) return;

            almacenamiento.limpiarHistorico();
            almacenamiento.limpiarCacheCompleta();
            paginas.historico.render();
          }
        }
      },

      favoritos: {
        html: {},
        init() {
          this.html = {
            lista: document.querySelector('#lista-favoritos'),
            btnLimpiar: document.querySelector('#btn-limpiar-favoritos'),
          };

          this.render();
          this.html.lista.addEventListener('click', (e) => this.handlers.onListaClick(e));
          this.html.btnLimpiar.addEventListener('click', () => this.handlers.onLimpiar());
        },

        render() {
          const lista = almacenamiento.obtenerFavoritos();

          if (lista.length === 0) {
            this.html.lista.innerHTML = templates.vistaVacia({
              titulo: 'No hay favoritos',
              subtitulo: 'Agrega favoritos desde la Página de buscar, Histórico o VS',
            });
            return;
          }

          this.html.lista.innerHTML = lista.map(p => templates.itemLista({
            pokemonMini: p,
            mostrarBotonFavorito: false
          })).join('');
        },

        handlers: {
          onListaClick(e) {
            const botonAccion = e.target.closest('[data-accion]');
            const item = e.target.closest('.item-lista');
            if (!item) return;

            const id = Number(item.dataset.id);
            const nombre = item.dataset.nombre;

            if (botonAccion?.dataset.accion === 'eliminar-item') {
              almacenamiento.eliminarFavorito(id);
              paginas.favoritos.render();
              return;
            }

            location.href = `index.html?q=${encodeURIComponent(nombre)}&tipo=pokemon`;
          },

          onLimpiar() {
            const ok = confirm('¿Seguro que quieres limpiar todos los favoritos?');
            if (!ok) return;

            almacenamiento.limpiarFavoritos();
            paginas.favoritos.render();
          }
        }
      },

            /*
        =========================================================
        VS (Comparador)
        =========================================================
        Aquí manejamos un “estado” simple en memoria:
        - p1 y p2 guardan los Pokémon ya cargados desde la API (o caché).
        - origen1 y origen2 guardan si vino de API o caché, para mostrar el badge.
      */
vs: {
        html: {},
        estado: {
          p1: null,
          p2: null,
          origen1: null,
          origen2: null,
        },

        init() {
          this.html = {
            input1: document.querySelector('#vs-pokemon-1'),
            input2: document.querySelector('#vs-pokemon-2'),
            btnBuscar1: document.querySelector('#btn-vs-buscar-1'),
            btnBuscar2: document.querySelector('#btn-vs-buscar-2'),
            btnBatalla: document.querySelector('#btn-batalla'),
            zonaCartas: document.querySelector('#zona-vs-cartas'),
            zonaResultado: document.querySelector('#zona-vs-resultado'),
          };

          // Estado vacío
          this.html.zonaCartas.innerHTML = templates.vsCartasVacias();
          this.html.zonaResultado.innerHTML = templates.vsPanelVacio();

          this.html.btnBuscar1.addEventListener('click', () => this.buscarLado(1));
          this.html.btnBuscar2.addEventListener('click', () => this.buscarLado(2));
          this.html.btnBatalla.addEventListener('click', () => this.batallar());

          this.html.zonaCartas.addEventListener('click', (e) => this.handlers.onClickCorazon(e));

        },

        handlers: {
          onClickCorazon(e) {
            const boton = e.target.closest('[data-accion="toggle-favorito"]');
            if (!boton) return;

            const carta = e.target.closest('[data-id]');
            if (!carta) return;

            const id = Number(carta.dataset.id);
            const nombre = carta.dataset.nombre;

            const pokemonApi =
              (paginas.vs.estado.p1?.id === id) ? paginas.vs.estado.p1 :
              (paginas.vs.estado.p2?.id === id) ? paginas.vs.estado.p2 : null;

            const pokemonMini = {
              id,
              nombre,
              sprite: utils.spritePorId(id),
              tipos: pokemonApi ? pokemonApi.types.map(x => x.type.name) : [],
            };

            const ahoraEsFav = almacenamiento.alternarFavorito(pokemonMini);
            boton.classList.toggle('activo', ahoraEsFav);
          }
        },

        async buscarLado(lado) {
          const texto = (lado === 1)
            ? utils.normalizarTexto(this.html.input1.value)
            : utils.normalizarTexto(this.html.input2.value);

          if (!texto) {
            alert('Escribe un nombre o ID.');
            return;
          }

          this.html.zonaResultado.innerHTML = templates.mensajeCargando('Buscando pokémon...');
          try {
            const { origen, data: pokemonApi } = await api.obtenerPokemon(texto);

            if (lado === 1) {
              this.estado.p1 = pokemonApi;
              this.estado.origen1 = origen;
            } else {
              this.estado.p2 = pokemonApi;
              this.estado.origen2 = origen;
            }

            almacenamiento.agregarAlHistorico({
              id: pokemonApi.id,
              nombre: pokemonApi.name,
              sprite: pokemonApi.sprites?.front_default || utils.spritePorId(pokemonApi.id),
              tipos: pokemonApi.types.map(x => x.type.name),
            });

            this.renderCartas();
            this.actualizarBotonBatalla();

            // Si todavía no están los dos, mantenemos el panel con espada como en el profe
            if (!(this.estado.p1 && this.estado.p2)) {
              this.html.zonaResultado.innerHTML = templates.vsPanelVacio();
            } else {
              this.html.zonaResultado.innerHTML = '';
            }
          } catch {
            this.html.zonaResultado.innerHTML = templates.mensajeError('Pokémon no encontrado.');
          }
        },

        renderCartas() {
          const p1 = this.estado.p1;
          const p2 = this.estado.p2;

          if (!p1 || !p2) {
            const izquierda = p1
              ? templates.vsCartaPokemon({
                  pokemonApi: p1,
                  puntos: 0,
                  ganador: false,
                  origen: this.estado.origen1
                })
              : `<div class="vs-carta vacia">?</div>`;

            const derecha = p2
              ? templates.vsCartaPokemon({
                  pokemonApi: p2,
                  puntos: 0,
                  ganador: false,
                  origen: this.estado.origen2
                })
              : `<div class="vs-carta vacia">?</div>`;

            this.html.zonaCartas.innerHTML =
              `${izquierda}<div style="text-align:center;font-weight:900;">⚔️</div>${derecha}`;

            return;
          }

          this.html.zonaCartas.innerHTML =
            `${templates.vsCartaPokemon({
                pokemonApi: p1,
                puntos: 0,
                ganador: false,
                origen: this.estado.origen1
              })}
            <div style="text-align:center;font-weight:900;">VS</div>
            ${templates.vsCartaPokemon({
                pokemonApi: p2,
                puntos: 0,
                ganador: false,
                origen: this.estado.origen2
              })}`;
        },

        actualizarBotonBatalla() {
          this.html.btnBatalla.disabled = !(this.estado.p1 && this.estado.p2);
        },

        batallar() {
          /*
            Algoritmo de la batalla
            1) Sumamos stats base de cada Pokémon.
            2) Tomamos el primer tipo de cada uno como “tipo atacante”.
            3) Calculamos multiplicadores contra el tipo del oponente.
            4) Puntaje final = baseTotal * multiplicador
            5) El mayor puntaje gana, y lo marcamos visualmente.
          */
          const p1 = this.estado.p1;
          const p2 = this.estado.p2;
          if (!p1 || !p2) return;

          const sumaStats = (pokemonApi) =>
            pokemonApi.stats.reduce((acc, s) => acc + s.base_stat, 0);

          const base1 = sumaStats(p1);
          const base2 = sumaStats(p2);

          const tipos1 = p1.types.map(x => x.type.name);
          const tipos2 = p2.types.map(x => x.type.name);

          const tipoAtacante1 = tipos1[0];
          const tipoAtacante2 = tipos2[0];

          const mult1 = tipos.multiplicador(tipoAtacante1, tipos2);
          const mult2 = tipos.multiplicador(tipoAtacante2, tipos1);

          const final1 = base1 * mult1;
          const final2 = base2 * mult2;

          const ganador1 = final1 > final2;
          const ganador2 = final2 > final1;

          this.html.zonaCartas.innerHTML =
            `${templates.vsCartaPokemon({
                pokemonApi: p1,
                puntos: final1,
                ganador: ganador1,
                origen: this.estado.origen1
              })}
            <div style="text-align:center;font-weight:900;">VS</div>
            ${templates.vsCartaPokemon({
                pokemonApi: p2,
                puntos: final2,
                ganador: ganador2,
                origen: this.estado.origen2
              })}`;

          const explicacion1 = tipos.explicar(tipoAtacante1, tipos2[0], mult1);
          const explicacion2 = tipos.explicar(tipoAtacante2, tipos1[0], mult2);

          const linea1 = `${p1.name} vs ${p2.name}: x${utils.formatearMultiplicador(mult1)} — ${explicacion1}`;
          const linea2 = `${p2.name} vs ${p1.name}: x${utils.formatearMultiplicador(mult2)} — ${explicacion2}`;

          const statsMap = (pokemonApi) => {
            const m = {};
            for (const s of pokemonApi.stats) {
              m[s.stat.name] = s.base_stat;
            }
            return m;
          };

          const stats1 = statsMap(p1);
          const stats2 = statsMap(p2);

          this.html.zonaResultado.innerHTML = `
            <div class="tarjeta" style="padding:14px;">
              <div class="titulo-seccion">⚔️ Resultado de la batalla ⚔️</div>
              <div class="separador-punteado"></div>

              <div class="titulo-seccion">📊 Análisis de batalla</div>

              ${templates.bloqueVentajasTipo({ linea1, linea2 })}
              ${templates.bloqueComparacionStats({ stats1, stats2 })}
              ${templates.bloqueCalculo({
                base1, base2,
                mult1, mult2,
                final1, final2,
                n1: p1.name,
                n2: p2.name
              })}
            </div>
          `;
        }
      }
    };

    /* =========================================================
      INIT GENERAL
    ========================================================= */
    const init = () => {
      const pagina = document.body.dataset.pagina;
      if (!pagina || !paginas[pagina]) return;
      paginas[pagina].init();
    };

    return { init };
  })();

  App.init();
})();
