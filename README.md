# Pomodoro Timer App

Una aplicación web moderna para gestionar tu tiempo de estudio o trabajo usando la técnica Pomodoro. Construida con Astro, Preact y TypeScript para una experiencia rápida y accesible.

## ✨ Características

- **Técnica Pomodoro Clásica**: Sesiones de 25 minutos de foco alternadas con descansos de 5-15 minutos
- **Personalización**: Elige la duración total de tu sesión de trabajo
- **Interfaz Intuitiva**: Temporizador visual con círculo de progreso
- **Historial Diario**: Rastrea tus sesiones completadas
- **Notificaciones**: Alertas del navegador cuando termina una sesión
- **Sonido de Alarma**: Audio motivacional al finalizar
- **Internacionalización**: Soporte para español e inglés
- **Tema Oscuro/Claro**: Adaptable a tus preferencias
- **Responsive**: Funciona en desktop y móvil


## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ o Bun
- Git

### Instalación

1. Clona el repositorio:
```bash
git clone <tu-repo-url>
cd pomodoro
```

2. Instala dependencias:
```bash
bun install
# o npm install
```

3. Inicia el servidor de desarrollo:
```bash
bun dev
# o npm run dev
```

4. Abre [http://localhost:4321](http://localhost:4321) en tu navegador

### Build para Producción

```bash
bun build
# o npm run build
```

Los archivos se generan en la carpeta `dist/`.

## 🛠️ Scripts Disponibles

- `dev`: Inicia servidor de desarrollo
- `build`: Construye para producción
- `preview`: Vista previa del build
- `lint`: Ejecuta linting con Biome
- `format`: Formatea código con Biome

## 🏗️ Tecnologías

- **Framework**: [Astro](https://astro.build/) - Generador de sitios estáticos
- **UI**: [Preact](https://preactjs.com/) - React ligero
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
- **TypeScript**: Tipado fuerte
- **Linting**: [Biome](https://biomejs.dev/) - Linting y formateo rápido
- **Internacionalización**: Soporte nativo de Astro

## 📱 Uso

1. **Configura tu sesión**: Elige cuánto tiempo tienes disponible (ej: 2 horas)
2. **Inicia el timer**: La app genera automáticamente ciclos de foco y descanso
3. **Trabaja**: El temporizador cuenta regresivamente con visualización circular
4. **Descansa**: Alarma sonora y notificación al finalizar cada bloque
5. **Revisa tu progreso**: Ve tu historial diario de sesiones completadas

## 🎯 Técnica Pomodoro

La app implementa la técnica Pomodoro estándar:
- **Foco**: 25 minutos de trabajo concentrado
- **Descanso corto**: 5 minutos después de cada sesión de foco
- **Descanso largo**: 15 minutos después de 4 ciclos
- **Ciclos**: Se repiten hasta completar el tiempo planificado


## 🙏 Agradecimientos

- Inspirado en la técnica Pomodoro de Francesco Cirillo
- Construido con tecnologías modernas de la web
