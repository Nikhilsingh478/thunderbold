interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  image?: string;
}

interface OrderAddress {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface PrintableOrder {
  _id: string;
  userId?: string;
  products: OrderItem[];
  address?: OrderAddress;
  paymentMethod?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatCurrency(n?: number): string {
  if (n == null || !Number.isFinite(n)) return '₹0';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusBadgeColor(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'delivered' || s === 'completed') return '#16a34a';
  if (s === 'shipped') return '#2563eb';
  if (s === 'confirmed') return '#7c3aed';
  if (s === 'cancelled' || s === 'canceled') return '#dc2626';
  return '#92400e';
}

export function printInvoice(order: PrintableOrder): void {
  const addr = order.address ?? {};
  const items = order.products ?? [];
  const subtotal = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const orderId = order._id;
  const shortId = orderId?.slice(-10) ?? '—';
  const status = order.status ?? 'pending';
  const statusColor = statusBadgeColor(status);

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;">
        ${item.name ?? '—'}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#6b7280;text-align:center;">
        ${item.size ?? '—'}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;text-align:center;">
        ${item.quantity ?? 1}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;text-align:right;">
        ${formatCurrency(item.price)}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;font-weight:600;color:#111827;text-align:right;">
        ${formatCurrency((item.price ?? 0) * (item.quantity ?? 1))}
      </td>
    </tr>
  `).join('');

  const addressLines = [
    addr.fullName,
    addr.addressLine1,
    addr.addressLine2,
    [addr.city, addr.state, addr.pincode].filter(Boolean).join(', '),
  ].filter(Boolean);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Packing Slip — #${shortId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #fff;
      color: #111827;
      font-size: 14px;
      line-height: 1.5;
    }
    .page {
      max-width: 780px;
      margin: 0 auto;
      padding: 36px 40px;
    }
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #111827;
      margin-bottom: 28px;
    }
    .brand {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #111827;
    }
    .brand span { color: #d97706; }
    .doc-title {
      text-align: right;
    }
    .doc-title h2 {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #6b7280;
    }
    .doc-title p {
      font-size: 22px;
      font-weight: 800;
      color: #111827;
      letter-spacing: 0.04em;
      margin-top: 2px;
    }
    /* Meta grid */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .meta-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px 18px;
    }
    .meta-box h3 {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 8px;
    }
    .meta-box p {
      font-size: 13px;
      color: #111827;
      margin-bottom: 3px;
    }
    .meta-box p strong { font-weight: 600; }
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #fff;
      background: ${statusColor};
      margin-top: 4px;
    }
    /* Items table */
    .section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    thead th {
      background: #f3f4f6;
      padding: 10px 12px;
      text-align: left;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #6b7280;
    }
    thead th:last-child, thead th:nth-child(3), thead th:nth-child(4) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }
    thead th:nth-child(3) { text-align: center; }
    /* Summary */
    .summary {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 28px;
    }
    .summary-box {
      width: 260px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-row.total {
      background: #111827;
      color: #fff;
      font-weight: 700;
      font-size: 14px;
    }
    .summary-row label { color: #6b7280; }
    .summary-row.total label { color: #d1d5db; }
    /* Footer */
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer p {
      font-size: 11px;
      color: #9ca3af;
    }
    .footer strong { color: #374151; }
    @media print {
      body { background: #fff; }
      .page { padding: 20px; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="brand">THUNDER<span>BOLT</span></div>
      <div class="doc-title">
        <h2>Packing Slip</h2>
        <p>#${shortId}</p>
      </div>
    </div>

    <!-- Meta info grid -->
    <div class="meta-grid">
      <!-- Order details -->
      <div class="meta-box">
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Date:</strong> ${formatDate(order.createdAt)}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod ?? '—'}</p>
        <p><strong>Status:</strong></p>
        <span class="status-badge">${status}</span>
      </div>
      <!-- Ship to -->
      <div class="meta-box">
        <h3>Ship To</h3>
        ${addressLines.map(l => `<p>${l}</p>`).join('')}
        ${addr.phone ? `<p style="margin-top:6px;font-weight:600;">📞 ${addr.phone}</p>` : ''}
      </div>
    </div>

    <!-- Items -->
    <p class="section-title">Items Ordered</p>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Size</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Summary -->
    <div class="summary">
      <div class="summary-box">
        <div class="summary-row">
          <label>Subtotal</label>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        <div class="summary-row">
          <label>Shipping</label>
          <span style="color:#16a34a;font-weight:600;">Free</span>
        </div>
        <div class="summary-row total">
          <label>Total</label>
          <span>${formatCurrency(order.totalAmount ?? subtotal)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for your order!<br /><strong>Thunderbolt</strong> — Premium Denim Brand</p>
      <p style="text-align:right;">
        Customer: <strong>${addr.fullName ?? order.userId ?? '—'}</strong><br />
        Printed on: ${formatDate(new Date().toISOString())}
      </p>
    </div>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site to print invoices.');
    return;
  }
  win.document.write(html);
  win.document.close();
}
