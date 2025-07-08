// src/utils/invoiceTemplate.ts

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  userName: string;
  userAddress: string;
  userEmail: string;
  userId: string;
  accommodationName: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  paymentStatus: string;
  totalPrice: string; // Formateado como string con $
  subtotal: string;
  taxRate: number;
  taxAmount: string;
  grandTotal: string;
}

export const getInvoiceHtml = (data: InvoiceData): string => {
  let template = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Factura de Alojamiento</title>
    <style>
        body {
            font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #333;
            line-height: 1.6;
            font-size: 10px; /* Tamaño de fuente base para PDF */
        }
        .container {
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            border: 1px solid #eee;
            padding: 30px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 1px solid #eee;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #3B82F6; /* Color azul para el título */
            font-size: 24px;
            margin: 0;
            font-weight: bold;
        }
        .invoice-info {
            text-align: right;
        }
        .invoice-info p {
            margin: 2px 0;
        }
        .invoice-info .label {
            font-weight: bold;
            color: #555;
        }
        .company-details, .client-details {
            margin-bottom: 20px;
            width: 48%;
            display: inline-block;
            vertical-align: top;
        }
        .company-details {
            text-align: left;
        }
        .client-details {
            text-align: right;
        }
        .company-details h2, .client-details h2 {
            font-size: 16px;
            color: #3B82F6;
            margin-top: 0;
            margin-bottom: 10px;
        }
        .company-details p, .client-details p {
            margin: 2px 0;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #3B82F6;
            margin-top: 20px;
            margin-bottom: 10px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .item-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .item-table th, .item-table td {
            border: 1px solid #eee;
            padding: 8px;
            text-align: left;
        }
        .item-table th {
            background-color: #f8f8f8;
            font-weight: bold;
            color: #555;
        }
        .total-section {
            text-align: right;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #eee;
        }
        .total-row {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 5px;
        }
        .total-row .label {
            font-weight: bold;
            margin-right: 15px;
        }
        .total-row .value {
            width: 80px;
            text-align: right;
        }
        .grand-total {
            font-size: 16px;
            font-weight: bold;
            color: #3B82F6;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #777;
            font-size: 9px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>FACTURA</h1>
            <div class="invoice-info">
                <p><span class="label">No. Factura:</span> {{invoiceNumber}}</p>
                <p><span class="label">Fecha:</span> {{invoiceDate}}</p>
                <p><span class="label">Fecha de Vencimiento:</span> {{dueDate}}</p>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between;">
            <div class="company-details">
                <h2>Tu Empresa S.A.</h2>
                <p>Tu Calle #123, Tu Ciudad</p>
                <p>Código Postal: 12345</p>
                <p>Email: info@tuempresa.com</p>
                <p>Tel: +123 456 7890</p>
                <p>RFC: XXXXXXXXXX</p>
            </div>

            <div class="client-details">
                <h2>Facturar a:</h2>
                <p>{{userName}}</p>
                <p>{{userAddress}}</p>
                <p>{{userEmail}}</p>
                <p>ID Cliente: {{userId}}</p>
            </div>
        </div>

        <div class="section-title">Detalles del Alojamiento</div>
        <table class="item-table">
            <thead>
                <tr>
                    <th>Alojamiento</th>
                    <th>Fechas</th>
                    <th>Huéspedes</th>
                    <th>Estado de Pago</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{accommodationName}}</td>
                    <td>{{checkInDate}} - {{checkOutDate}}</td>
                    <td>{{guests}}</td>
                    <td>{{paymentStatus}}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Conceptos de Pago</div>
        <table class="item-table">
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Precio Unitario</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Estancia en {{accommodationName}}</td>
                    <td>1</td>
                    <td>$ {{totalPrice}}</td>
                    <td>$ {{totalPrice}}</td>
                </tr>
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-row"><span class="label">Subtotal:</span> <span class="value">$ {{subtotal}}</span></div>
            <div class="total-row"><span class="label">IVA ({{taxRate}}%):</span> <span class="value">$ {{taxAmount}}</span></div>
            <div class="total-row grand-total"><span class="label">TOTAL:</span> <span class="value">$ {{grandTotal}}</span></div>
        </div>

        <div class="footer">
            <p>Gracias por tu reserva.</p>
            <p>Por favor, realiza el pago antes de la fecha de vencimiento.</p>
        </div>
    </div>
</body>
</html>
  `;

  // Reemplazar los placeholders con los datos reales
  template = template.replace(/{{invoiceNumber}}/g, data.invoiceNumber || 'N/A');
  template = template.replace(/{{invoiceDate}}/g, data.invoiceDate || 'N/A');
  template = template.replace(/{{dueDate}}/g, data.dueDate || 'N/A');
  template = template.replace(/{{userName}}/g, data.userName || 'N/A');
  template = template.replace(/{{userAddress}}/g, data.userAddress || 'N/A');
  template = template.replace(/{{userEmail}}/g, data.userEmail || 'N/A');
  template = template.replace(/{{userId}}/g, data.userId || 'N/A');
  template = template.replace(/{{accommodationName}}/g, data.accommodationName || 'N/A');
  template = template.replace(/{{checkInDate}}/g, data.checkInDate || 'N/A');
  template = template.replace(/{{checkOutDate}}/g, data.checkOutDate || 'N/A');
  template = template.replace(/{{guests}}/g, data.guests.toString() || 'N/A');
  template = template.replace(/{{paymentStatus}}/g, data.paymentStatus || 'N/A');
  template = template.replace(/{{totalPrice}}/g, data.totalPrice || '0.00');
  template = template.replace(/{{subtotal}}/g, data.subtotal || '0.00');
  template = template.replace(/{{taxRate}}/g, data.taxRate.toString() || '0');
  template = template.replace(/{{taxAmount}}/g, data.taxAmount || '0.00');
  template = template.replace(/{{grandTotal}}/g, data.grandTotal || '0.00');

  return template;
};