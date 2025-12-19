# 🎮 PokéFinder - Aplicación Web con Consumo de API

## 📋 Información del Proyecto

**Nombre del Estudiante:**  
- Francisco Lata (8-940-1000)  
- Oscar Herrera (8-970-1899)

**Repositorio:** [https://github.com/fran0699/semestral-ds5](https://github.com/fran0699/semestral-ds5)  
**GitHub Pages:** [https://fran0699.github.io/semestral-ds5/](https://fran0699.github.io/semestral-ds5/)

## 🚀 Instrucciones de Uso

### 1. **Acceso a la aplicación**
- Abre el enlace de GitHub Pages en cualquier navegador moderno
- La aplicación está completamente funcional sin necesidad de instalación adicional

### 2. **Navegación entre páginas**
La aplicación cuenta con 4 páginas principales:
- **🔎 Buscar** (Página principal): Para buscar Pokémon o habilidades
- **📜 Histórico**: Muestra tu historial de búsquedas
- **⚔️ VS**: Compara dos Pokémon
- **❤️ Favoritos**: Lista tus Pokémon favoritos

### 3. **Funcionalidades principales**

#### **Búsqueda de Pokémon:**
1. En la página principal, selecciona "👾 Pokémon" en el selector
2. Escribe el nombre o número del Pokémon (ej: "pikachu" o "25")
3. Presiona "Buscar" o presiona Enter
4. La tarjeta mostrará:
   - Sprite del Pokémon
   - Nombre y número
   - Tipos
   - Estadísticas con barras visuales
   - Habilidades (clicables)
   - Cadena evolutiva

#### **Búsqueda de Habilidades:**
1. Cambia el selector a "✨ Habilidad"
2. Escribe el nombre de la habilidad (ej: "static")
3. Presiona "Buscar"
4. Verás:
   - Descripción de la habilidad
   - Lista de Pokémon que la poseen

#### **Sistema de Favoritos:**
- Haz clic en el corazón ❤️ en cualquier tarjeta de Pokémon
- Los favoritos se guardan automáticamente
- Accede a ellos desde la página "❤️ Favoritos"

#### **Modo VS (Comparador):**
1. Ve a la página "⚔️ VS"
2. Ingresa dos Pokémon en los campos correspondientes
3. Haz clic en "Buscar" para cada uno
4. Cuando ambos estén cargados, presiona "⚔️ ¡Batallar!"
5. La aplicación calculará:
   - Ventajas de tipo
   - Comparación de estadísticas
   - Ganador basado en puntaje

#### **Histórico:**
- Todas las búsquedas se guardan automáticamente
- Elimina elementos individualmente con 🗑️
- Limpia todo el historial con el botón "🗑️ Limpiar todo"

### 4. **Características técnicas**
- **Caché automático**: Los datos se guardan por 24 horas
- **Badges de origen**: Indican si la información viene de API o caché
- **Responsive**: Funciona en dispositivos móviles y desktop
- **Sin dependencias**: JavaScript vanilla puro

## 📸 Capturas de Pantalla

## 📊 Rúbrica de Evaluación

| Criterio | Excelente (100%) | Bueno (75%) | Regular (50%) | Deficiente (25%) | Puntaje |
|----------|------------------|-------------|---------------|------------------|---------|
| **Funcionalidad** | ✅ Todas las funciones operan correctamente | Funciones principales operan, errores menores | Algunas funciones no operan | Funcionalidad básica incompleta | 100% |
| **Diseño Brutalist** | ✅ Sigue guía de estilo completamente | Mayoría de estilos aplicados | Estilos parcialmente aplicados | No sigue el estilo | 100% |
| **Código Limpio** | ✅ Bien organizado, comentado, modular | Organizado con algunos comentarios | Parcialmente organizado | Código desorganizado | 100% |
| **Manejo de Errores** | ✅ Todos los errores manejados con UX clara | Mayoría de errores manejados | Algunos errores manejados | Sin manejo de errores | 100% |
| **Caché/Storage** | ✅ Sistema completo con TTL y limpieza | Sistema funcional básico | Implementación parcial | No implementado | 100% |

## 🛠️ Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilo Brutalist con Variables CSS, Grid y Flexbox
- **JavaScript Vanilla**: Módulos IIFE, async/await, localStorage
- **PokeAPI**: API REST para datos de Pokémon
- **Git/GitHub**: Control de versiones y despliegue

## 📁 Estructura del Proyecto
```
📁 Proyecto
├── index.html          (Búsqueda principal)
├── historico.html      (Histórico de búsquedas)
├── favoritos.html      (Lista de favoritos)
├── vs.html             (Comparador VS)
├── shared.css          (Estilos compartidos)
└── shared.js           (Módulo de almacenamiento)
```
