# 🌼 Margaritas 3D - Next.js & Three.js

Una experiencia botánica interactiva en 3D construida con **Next.js (App Router)**, **Three.js** y **Tailwind CSS**, 100% optimizada para ser desplegada en **Vercel**.

---

## ✨ Características Principales

1. **Modelado y Texturizado Botánico Procedural:**
   - **Capítulo / Botón floral:** Espiral áurea de Fibonacci (filotaxis botánica) generada proceduralmente en canvas con relieve 3D bump map.
   - **Pétalos orgánicos:** Geometría personalizada con curvatura natural, ligera concavidad longitudinal y distribución en capas concéntricas.
   - **Tallo y hojas:** Curvas spline naturales con ondulaciones y hojas dentadas.

2. **Física y Animaciones en Tiempo Real:**
   - **Viento orgánico:** Oscilaciones multicapa en tallo y cabeza floral con aleteo sutil de pétalos.
   - **Simulación de Floración:** Control interactivo de capullo a flor completamente abierta.
   - **Pétalos flotantes:** Sistema de partículas en el aire que reaccionan a la fuerza y dirección de la brisa.

3. **Interactividad "Me Quiere, No Me Quiere":**
   - **Deshoje 3D:** Haz clic o toca directamente cualquier pétalo en 3D para arrancarlo.
   - **Física aerodinámica:** El pétalo desprendido cae planeando y revoloteando en el aire hasta posarse en el suelo.
   - **Lluvia de confeti y celebración:** Al finalizar el deshoje se emite un veredicto con confeti y animación.
   - **Regeneración de pétalos:** Botón para hacer florecer la margarita nuevamente.

4. **3 Modos de Escena:**
   - 🌼 **Margarita Solitaria:** Enfoque detallado en primer plano con máxima fidelidad.
   - 💐 **Ramo Elegante:** Conjunto armonioso de margaritas con variaciones naturales de altura e inclinación.
   - 🌾 **Prado Florecido:** Campo abierto con decenas de margaritas mecidas por el viento.

5. **3 Ciclos de Iluminación y Atmósfera:**
   - ☀️ **Día Soleado:** Iluminación cálida y cielo despejado.
   - 🌅 **Atardecer Dorado (Golden Hour):** Sombras largas y tonos dorados/rojizos.
   - 🌙 **Noche Mágica:** Luz de luna con más de 50 **luciérnagas bioluminiscentes** que bailan alrededor de las flores.

6. **Audio Sintetizado con Web Audio API:**
   - Susurro del viento sintetizado y campanillas acústicas al deshojar pétalos.
   - Cero dependencias de archivos de audio externos (no sufre problemas de CORS ni fallos de carga en Vercel).

7. **Captura de Fotos HD:**
   - Botón integrado para descargar capturas de pantalla de la escena 3D en alta resolución.

---

## 🚀 Cómo ejecutar en desarrollo

```bash
# 1. Instalar dependencias (si aún no las tienes)
npm install

# 2. Iniciar el servidor local
npm run dev
```

Abre tu navegador en `http://localhost:3000`.

---

## ☁️ Cómo desplegar en Vercel

### Opción 1: Con Git (Recomendado)
1. Sube este repositorio a **GitHub**, **GitLab** o **Bitbucket**.
2. Ve a [vercel.com](https://vercel.com) e inicia sesión.
3. Haz clic en **"Add New..."** -> **"Project"**.
4. Importa tu repositorio.
5. Vercel detectará automáticamente Next.js. Haz clic en **"Deploy"**.

### Opción 2: Con Vercel CLI
```bash
npx vercel
```
¡Y tu proyecto estará en vivo en cuestión de segundos!
