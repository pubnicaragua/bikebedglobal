export const generateRoutesHtml = (
  routes: any[],
  helpers: { getDifficultyText: (d: string) => string; formatTime: (m: number | null) => string }
) => {
  const rows = routes.map(route => `
    <tr>
      <td>${escapeHtml(route.name)}</td>
      <td>${escapeHtml(route.description)}</td>
      <td>${route.distance} km</td>
      <td>${helpers.getDifficultyText(route.difficulty)}</td>
      <td>${helpers.formatTime(route.estimated_time)}</td>
      <td>${escapeHtml(route.start_location)}</td>
      <td>${escapeHtml(route.end_location)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte de Rutas</title>
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 40px;
            font-size: 12px;
            color: #333;
          }
          h1 {
            text-align: center;
            margin-bottom: 40px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: left;
          }
          th {
            background: #f0f0f0;
          }
          tr:nth-child(even) {
            background: #fafafa;
          }
        </style>
      </head>
      <body>
        <h1>Reporte de Rutas</h1>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Distancia</th>
              <th>Dificultad</th>
              <th>Tiempo Estimado</th>
              <th>Inicio</th>
              <th>Fin</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </body>
    </html>
  `;
};

// 🔒 Escapa caracteres problemáticos para evitar errores de impresión
const escapeHtml = (unsafe: string) =>
  unsafe
    ?.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
