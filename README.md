#  PokéFinder - Aplicación Web con Consumo de API

##  Información del Proyecto

**Nombre del Estudiante:**  
- Francisco Lata (8-940-1000)  
- Oscar Herrera (8-970-1899)

**Repositorio:** [https://github.com/fran0699/semestral-ds5](https://github.com/fran0699/semestral-ds5)  
**GitHub Pages:** [https://fran0699.github.io/semestral-ds5/](https://fran0699.github.io/semestral-ds5/)

##  Instrucciones de Uso

### 1. **Acceso a la aplicación**
- Abre el enlace de GitHub Pages en cualquier navegador
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

##  Capturas de Pantalla
<img width="1364" height="592" alt="Buscar1" src="https://github.com/user-attachments/assets/12fd7cb5-1b3d-4bc2-a8e1-160da88ac43c" />
<img width="1365" height="594" alt="Buscar2" src="https://github.com/user-attachments/assets/9749a69f-7bba-4c88-83d3-15700c90a1f8" />
<img width="1360" height="597" alt="Buscar3" src="https://github.com/user-attachments/assets/afc9952f-77e1-4ea4-a10a-f3e90fd663b8" />
<img width="1364" height="592" alt="Historico1" src="https://github.com/user-attachments/assets/61292aee-fc86-4c86-a7da-e81a88670a02" />
<img width="1365" height="586" alt="Historico2" src="https://github.com/user-attachments/assets/a7d4bf88-b5c7-46f4-9754-5f8f4ff23279" />
<img width="1362" height="589" alt="Favoritos1" src="https://github.com/user-attachments/assets/166bb9ad-0817-4bf7-863d-1e9484830f15" />
<img width="1362" height="593" alt="Favoritos2" src="https://github.com/user-attachments/assets/159aa96d-3e53-4a5b-b3dd-1ff100390bc1" />
<img width="1364" height="595" alt="vs1" src="https://github.com/user-attachments/assets/eb057f90-5ccd-49b3-9a12-e0854f380b8a" />
<img width="1361" height="579" alt="vs2" src="https://github.com/user-attachments/assets/333af1b6-6fca-4616-b04c-c0af0154d054" />
<img width="1362" height="596" alt="vs3" src="https://github.com/user-attachments/assets/5ab40958-08fd-4642-afb8-765c296fc962" />

##  Rúbrica de Evaluación

| Criterio | Excelente (100%) | Bueno (75%) | Regular (50%) | Deficiente (25%) | Puntaje |
|----------|------------------|-------------|---------------|------------------|---------|
| **Funcionalidad** | ✅ Todas las funciones operan correctamente | Funciones principales operan, errores menores | Algunas funciones no operan | Funcionalidad básica incompleta | 100% |
| **Diseño Brutalist** | ✅ Sigue guía de estilo completamente | Mayoría de estilos aplicados | Estilos parcialmente aplicados | No sigue el estilo | 100% |
| **Código Limpio** | ✅ Bien organizado, comentado, modular | Organizado con algunos comentarios | Parcialmente organizado | Código desorganizado | 100% |
| **Manejo de Errores** | ✅ Todos los errores manejados con UX clara | Mayoría de errores manejados | Algunos errores manejados | Sin manejo de errores | 100% |
| **Caché/Storage** | ✅ Sistema completo con TTL y limpieza | Sistema funcional básico | Implementación parcial | No implementado | 100% |

##  Tecnologías Utilizadas

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
