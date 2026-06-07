# Hornero Backoffice

Panel de administración interno de Proyecto Hornero. Es una aplicación
independiente del frontend público: solo los usuarios con rol `ADMIN`
pueden iniciar sesión.

## Funcionalidad

- **Login**: pantalla de acceso restringida a administradores.
- **Verificaciones**: revisión y aprobación/rechazo de las solicitudes de
  los usuarios que quieren convertirse en creadores.

La navegación es una única página con una barra lateral izquierda.

## Desarrollo

```bash
npm install
npm run dev          # http://localhost:5174
```

Configurá `VITE_API_URL` en `.env.backoffice` apuntando al backend.

## Build de producción

```bash
npm run build        # genera dist/
```

## Docker

```bash
# desde la raíz del repo
make up-bo           # modo dev (HMR)
make up-bo-prod      # modo prod (nginx, puerto 3001)
```
Prueba deploy