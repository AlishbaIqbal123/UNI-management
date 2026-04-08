/**
 * University Management OS - Institutional Reporting Utilities
 * Handles data transformation for PDF (Print) and Excel (CSV) workflows.
 */

export const exportToCSV = (data, fileName) => {
  if (!data || !data.length) return;
  
  // Extract headers
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Add Header Row
  csvRows.push(headers.join(','));
  
  // Add Data Rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] === null || row[header] === undefined ? '' : row[header];
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const generateInstitutionalReport = (title, columns, data) => {
  // Simple print handler that formats a new window for printing
  const printWindow = window.open('', '_blank');
  const html = `
    <html>
      <head>
        <title>COMSATS University Islamabad - Institutional Report</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { display: flex; align-items: center; border-bottom: 2px solid #ffb74d; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { width: 80px; height: 80px; margin-right: 20px; }
          .title-area h1 { margin: 0; font-size: 24px; color: #1a1a1a; }
          .title-area p { margin: 5px 0 0; font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f8f9fa; text-align: left; padding: 12px; border-bottom: 2px solid #dee2e6; font-size: 12px; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
          .footer { margin-top: 50px; font-size: 11px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img class="logo" src="https://crystalpng.com/wp-content/uploads/2022/02/COMSATS-University-logo.png" alt="University Logo" />
          <div class="title-area">
            <h1>COMSATS University Islamabad</h1>
            <p>Official Institutional Record: ${title}</p>
            <p style="font-size: 11px">Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${data.map(row => `
              <tr>
                ${columns.map(col => `<td>${row[col] || row[col.toLowerCase()] || 'N/A'}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>This is a computer-generated institutional document and does not require a physical signature.</p>
          <p>© 2026 COMSATS University Islamabad - Management OS</p>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
};
