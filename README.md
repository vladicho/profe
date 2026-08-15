# Profe Hawk-Eye

Analizador experimental de trayectoria para **frontón** y **ráquetbol**, disponible en español y portugués.

## Qué hace

- procesa videos localmente en el navegador;
- calibra la cancha con cuatro puntos;
- selecciona la pelota por color;
- rastrea hasta 12 segundos cuadro a cuadro;
- dibuja la trayectoria y estima el punto de impacto;
- permite correcciones manuales.

## Privacidad

Los videos cargados no se almacenan en el servidor. El procesamiento ocurre en el dispositivo del usuario.

## Limitaciones

La estimación usa una sola cámara y no sustituye un sistema oficial de arbitraje con múltiples cámaras sincronizadas. Los enlaces de YouTube y Facebook requieren integración con las API oficiales; la versión inicial analiza archivos que el usuario tiene autorización para usar.

## Desarrollo

```bash
npm ci
npm run dev
```

## Deploy directo en Cloudflare

El proyecto se publica desde GitHub mediante Cloudflare Workers Builds, sin
pasar por ChatGPT Sites.

- Comando de build: `npm run build`
- Comando de deploy: `npx wrangler deploy`
- Dominio: `profe.lugarerrado.com`

## Referencias visuales

- Frontón: https://www.youtube.com/watch?v=2v7q0DFnkO4
- Ráquetbol: https://www.youtube.com/watch?v=--eOuXOeams
