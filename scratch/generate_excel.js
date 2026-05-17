const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const mdPath = path.join(__dirname, '../TESTING_DOCUMENT.md');
const excelPath = path.join(__dirname, '../TESTING_DOCUMENT.xlsx');

function parseMarkdown() {
  const content = fs.readFileSync(mdPath, 'utf8');

  // Regexes for Black Box Test Cases
  const bbRegex = /__Test Case ID__:\s*(TC-BB-\d+)|__Requirement__:\s*(.*?)\n|__Test Type__:\s*(.*?)\n|__Description__:\s*(.*?)\n|\|\s*\*\*Pre-condition\*\*\s*\|\s*(.*?)\s*\||\|\s*\*\*Input Values\*\*\s*\|\s*(.*?)\s*\||\|\s*\*\*Test Steps\*\*\s*\|\s*(.*?)\s*\||\|\s*\*\*Expected Output\*\*\s*\|\s*(.*?)\s*\||\|\s*\*\*Actual Output\*\*\s*\|\s*(.*?)\s*\||\|\s*\*\*Pass\/Fail\*\*\s*\|\s*(.*?)\s*\|/gi;
  // Let's split the markdown into sections to parse robustly.
  const sections = content.split(/---/g);

  const blackBoxCases = [];
  const integrationCases = [];
  const bbSummary = [];
  const intSummary = [];

  sections.forEach(section => {
    // Check if it's a Black Box Case
    if (section.includes('TC-BB-')) {
      const idMatch = section.match(/\*\*Test Case ID\*\*:\s*(TC-BB-\d+)/i);
      const reqMatch = section.match(/\*\*Requirement\*\*:\s*(.*?)(?:\n|\r)/i);
      const typeMatch = section.match(/\*\*Test Type\*\*:\s*(.*?)(?:\n|\r)/i);
      const descMatch = section.match(/\*\*Description\*\*:\s*(.*?)(?:\n|\r)/i);
      
      const preMatch = section.match(/\|\s*\*\*Pre-condition\*\*\s*\|\s*(.*?)\s*\|/i);
      const inputMatch = section.match(/\|\s*\*\*Input Values\*\*\s*\|\s*(.*?)\s*\|/i);
      const stepsMatch = section.match(/\|\s*\*\*Test Steps\*\*\s*\|\s*(.*?)\s*\|/i);
      const expectedMatch = section.match(/\|\s*\*\*Expected Output\*\*\s*\|\s*(.*?)\s*\|/i);
      const actualMatch = section.match(/\|\s*\*\*Actual Output\*\*\s*\|\s*(.*?)\s*\|/i);
      const passMatch = section.match(/\|\s*\*\*Pass\/Fail\*\*\s*\|\s*(.*?)\s*\|/i);

      if (idMatch) {
        blackBoxCases.push({
          id: idMatch[1].trim(),
          requirement: reqMatch ? reqMatch[1].trim() : '',
          type: typeMatch ? typeMatch[1].trim() : '',
          description: descMatch ? descMatch[1].trim() : '',
          precondition: preMatch ? preMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          inputValues: inputMatch ? inputMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          testSteps: stepsMatch ? stepsMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          expectedOutput: expectedMatch ? expectedMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          actualOutput: actualMatch ? actualMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          passFail: passMatch ? passMatch[1].trim() : 'PENDING'
        });
      }
    }

    // Check if it's an Integration Case
    if (section.includes('TC-INT-')) {
      const idMatch = section.match(/\*\*Test Case ID\*\*:\s*(TC-INT-\d+)/i);
      const intPointMatch = section.match(/\*\*Integration Point\*\*:\s*(.*?)(?:\n|\r)/i);
      const descMatch = section.match(/\*\*Description\*\*:\s*(.*?)(?:\n|\r)/i);
      
      const modulesMatch = section.match(/\|\s*\*\*Modules Involved\*\*\s*\|\s*(.*?)\s*\|/i);
      const flowMatch = section.match(/\|\s*\*\*Data Flow\*\*\s*\|\s*(.*?)\s*\|/i);
      const preMatch = section.match(/\|\s*\*\*Pre-condition\*\*\s*\|\s*(.*?)\s*\|/i);
      const stepsMatch = section.match(/\|\s*\*\*Test Steps\*\*\s*\|\s*(.*?)\s*\|/i);
      const expectedMatch = section.match(/\|\s*\*\*Expected Result\*\*\s*\|\s*(.*?)\s*\|/i);
      const actualMatch = section.match(/\|\s*\*\*Actual Result\*\*\s*\|\s*(.*?)\s*\|/i);
      const issuesMatch = section.match(/\|\s*\*\*Integration Issues Found\*\*\s*\|\s*(.*?)\s*\|/i);

      if (idMatch) {
        integrationCases.push({
          id: idMatch[1].trim(),
          integrationPoint: intPointMatch ? intPointMatch[1].trim() : '',
          description: descMatch ? descMatch[1].trim() : '',
          modulesInvolved: modulesMatch ? modulesMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          dataFlow: flowMatch ? flowMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          precondition: preMatch ? preMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          testSteps: stepsMatch ? stepsMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          expectedResult: expectedMatch ? expectedMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          actualResult: actualMatch ? actualMatch[1].replace(/<br>/g, '\n').replace(/\\n/g, '\n').trim() : '',
          issuesFound: issuesMatch ? issuesMatch[1].trim() : 'None (To be evaluated)'
        });
      }
    }
  });

  return { blackBoxCases, integrationCases };
}

async function createExcel() {
  const { blackBoxCases, integrationCases } = parseMarkdown();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Senior Quality Assurance Engineer';
  workbook.lastModifiedBy = 'Senior Quality Assurance Engineer';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Colors & Styles Definitions
  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F497D' } // Premium Dark Indigo
  };

  const titleFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F243E' } // Deep Dark Blue
  };

  const zebraFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF2F5F9' } // Very Light Blue Gray
  };

  const pendingFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFF2CC' } // Light Yellow for PENDING
  };

  const textStyle = { name: 'Segoe UI', size: 10 };
  const titleStyle = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  const sectionStyle = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  const headerStyle = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };

  const borderStyle = {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
  };

  const alignCenter = { vertical: 'middle', horizontal: 'center' };
  const alignLeftWrap = { vertical: 'top', horizontal: 'left', wrapText: true };

  // ==========================================
  // SHEET 1: Black Box Summary Index
  // ==========================================
  const wsBBSummary = workbook.addWorksheet('Black Box Index');
  wsBBSummary.views = [{ showGridLines: true }];

  // Title Banner
  wsBBSummary.mergeCells('A1:E1');
  const titleCell1 = wsBBSummary.getCell('A1');
  titleCell1.value = 'COMSATS University Islamabad, Vehari Campus - UMS Test Suite';
  titleCell1.font = titleStyle;
  titleCell1.fill = titleFill;
  titleCell1.alignment = alignCenter;
  wsBBSummary.getRow(1).height = 40;

  wsBBSummary.mergeCells('A2:E2');
  const subtitleCell1 = wsBBSummary.getCell('A2');
  subtitleCell1.value = 'Task 1 — Black Box Testing Summary Index';
  subtitleCell1.font = sectionStyle;
  subtitleCell1.fill = headerFill;
  subtitleCell1.alignment = alignCenter;
  wsBBSummary.getRow(2).height = 25;

  wsBBSummary.addRow([]); // Blank Row

  // Headers
  const bbSummaryHeaders = ['Test Case ID', 'Requirement', 'Test Type', 'Description', 'Status'];
  wsBBSummary.addRow(bbSummaryHeaders);
  const bbSumHeaderRow = wsBBSummary.getRow(4);
  bbSumHeaderRow.height = 25;
  bbSumHeaderRow.eachCell((cell) => {
    cell.font = headerStyle;
    cell.fill = headerFill;
    cell.alignment = alignCenter;
    cell.border = borderStyle;
  });

  // Populate data
  blackBoxCases.forEach((item, index) => {
    const row = wsBBSummary.addRow([
      item.id,
      item.requirement,
      item.type,
      item.description,
      item.passFail
    ]);
    row.height = 22;
    
    // Zebra striping
    const fill = index % 2 === 0 ? null : zebraFill;
    row.eachCell((cell, colNum) => {
      cell.font = textStyle;
      cell.border = borderStyle;
      cell.alignment = colNum === 1 || colNum === 5 ? alignCenter : alignLeftWrap;
      if (fill && colNum !== 5) cell.fill = fill;
      
      // Style for Status column (column 5)
      if (colNum === 5) {
        cell.font = { ...textStyle, bold: true, color: { argb: 'FFB25E00' } };
        cell.fill = pendingFill;
      }
    });
  });

  // Set specific column widths
  wsBBSummary.getColumn(1).width = 15; // ID
  wsBBSummary.getColumn(2).width = 30; // Requirement
  wsBBSummary.getColumn(3).width = 25; // Test Type
  wsBBSummary.getColumn(4).width = 65; // Description
  wsBBSummary.getColumn(5).width = 15; // Status

  // ==========================================
  // SHEET 2: Black Box Details
  // ==========================================
  const wsBBDetails = workbook.addWorksheet('Black Box Details');
  wsBBDetails.views = [{ showGridLines: true }];

  wsBBDetails.mergeCells('A1:J1');
  const titleCell2 = wsBBDetails.getCell('A1');
  titleCell2.value = 'COMSATS University Islamabad, Vehari Campus - UMS Test Suite';
  titleCell2.font = titleStyle;
  titleCell2.fill = titleFill;
  titleCell2.alignment = alignCenter;
  wsBBDetails.getRow(1).height = 40;

  wsBBDetails.mergeCells('A2:J2');
  const subtitleCell2 = wsBBDetails.getCell('A2');
  subtitleCell2.value = 'Task 1 — Black Box Detailed Test Cases Ledger';
  subtitleCell2.font = sectionStyle;
  subtitleCell2.fill = headerFill;
  subtitleCell2.alignment = alignCenter;
  wsBBDetails.getRow(2).height = 25;

  wsBBDetails.addRow([]);

  // Headers
  const bbDetailHeaders = [
    'Test Case ID', 'Requirement', 'Test Type', 'Description', 
    'Pre-condition', 'Input Values', 'Test Steps', 'Expected Output', 
    'Actual Output', 'Pass/Fail'
  ];
  wsBBDetails.addRow(bbDetailHeaders);
  const bbDetHeaderRow = wsBBDetails.getRow(4);
  bbDetHeaderRow.height = 28;
  bbDetHeaderRow.eachCell((cell) => {
    cell.font = headerStyle;
    cell.fill = headerFill;
    cell.alignment = alignCenter;
    cell.border = borderStyle;
  });

  // Populate data
  blackBoxCases.forEach((item, index) => {
    const row = wsBBDetails.addRow([
      item.id,
      item.requirement,
      item.type,
      item.description,
      item.precondition,
      item.inputValues,
      item.testSteps,
      item.expectedOutput,
      item.actualOutput,
      item.passFail
    ]);
    
    // Auto adjust row height based on content length
    let maxLines = 1;
    row.values.forEach(val => {
      if (typeof val === 'string') {
        const lines = val.split('\n').length;
        if (lines > maxLines) maxLines = lines;
      }
    });
    row.height = Math.max(25, maxLines * 15 + 10);

    const fill = index % 2 === 0 ? null : zebraFill;
    row.eachCell((cell, colNum) => {
      cell.font = textStyle;
      cell.border = borderStyle;
      cell.alignment = colNum === 1 || colNum === 10 ? { vertical: 'top', horizontal: 'center' } : alignLeftWrap;
      if (fill && colNum !== 10) cell.fill = fill;

      if (colNum === 10) {
        cell.font = { ...textStyle, bold: true, color: { argb: 'FFB25E00' } };
        cell.fill = pendingFill;
      }
    });
  });

  // Column Widths
  wsBBDetails.getColumn(1).width = 15; // ID
  wsBBDetails.getColumn(2).width = 25; // Requirement
  wsBBDetails.getColumn(3).width = 20; // Test Type
  wsBBDetails.getColumn(4).width = 30; // Description
  wsBBDetails.getColumn(5).width = 35; // Pre-condition
  wsBBDetails.getColumn(6).width = 30; // Input Values
  wsBBDetails.getColumn(7).width = 40; // Test Steps
  wsBBDetails.getColumn(8).width = 45; // Expected Output
  wsBBDetails.getColumn(9).width = 30; // Actual Output
  wsBBDetails.getColumn(10).width = 15; // Pass/Fail


  // ==========================================
  // SHEET 3: Integration Summary Index
  // ==========================================
  const wsIntSummary = workbook.addWorksheet('Integration Index');
  wsIntSummary.views = [{ showGridLines: true }];

  wsIntSummary.mergeCells('A1:D1');
  const titleCell3 = wsIntSummary.getCell('A1');
  titleCell3.value = 'COMSATS University Islamabad, Vehari Campus - UMS Test Suite';
  titleCell3.font = titleStyle;
  titleCell3.fill = titleFill;
  titleCell3.alignment = alignCenter;
  wsIntSummary.getRow(1).height = 40;

  wsIntSummary.mergeCells('A2:D2');
  const subtitleCell3 = wsIntSummary.getCell('A2');
  subtitleCell3.value = 'Task 2 — Integration Testing Summary Index';
  subtitleCell3.font = sectionStyle;
  subtitleCell3.fill = headerFill;
  subtitleCell3.alignment = alignCenter;
  wsIntSummary.getRow(2).height = 25;

  wsIntSummary.addRow([]);

  // Headers
  const intSummaryHeaders = ['Test Case ID', 'Integration Point', 'Description', 'Status'];
  wsIntSummary.addRow(intSummaryHeaders);
  const intSumHeaderRow = wsIntSummary.getRow(4);
  intSumHeaderRow.height = 25;
  intSumHeaderRow.eachCell((cell) => {
    cell.font = headerStyle;
    cell.fill = headerFill;
    cell.alignment = alignCenter;
    cell.border = borderStyle;
  });

  // Populate data
  integrationCases.forEach((item, index) => {
    const row = wsIntSummary.addRow([
      item.id,
      item.integrationPoint,
      item.description,
      'PENDING'
    ]);
    row.height = 22;

    const fill = index % 2 === 0 ? null : zebraFill;
    row.eachCell((cell, colNum) => {
      cell.font = textStyle;
      cell.border = borderStyle;
      cell.alignment = colNum === 1 || colNum === 4 ? alignCenter : alignLeftWrap;
      if (fill && colNum !== 4) cell.fill = fill;

      if (colNum === 4) {
        cell.font = { ...textStyle, bold: true, color: { argb: 'FFB25E00' } };
        cell.fill = pendingFill;
      }
    });
  });

  wsIntSummary.getColumn(1).width = 15; // ID
  wsIntSummary.getColumn(2).width = 35; // Integration Point
  wsIntSummary.getColumn(3).width = 65; // Description
  wsIntSummary.getColumn(4).width = 15; // Status


  // ==========================================
  // SHEET 4: Integration Details
  // ==========================================
  const wsIntDetails = workbook.addWorksheet('Integration Details');
  wsIntDetails.views = [{ showGridLines: true }];

  wsIntDetails.mergeCells('A1:J1');
  const titleCell4 = wsIntDetails.getCell('A1');
  titleCell4.value = 'COMSATS University Islamabad, Vehari Campus - UMS Test Suite';
  titleCell4.font = titleStyle;
  titleCell4.fill = titleFill;
  titleCell4.alignment = alignCenter;
  wsIntDetails.getRow(1).height = 40;

  wsIntDetails.mergeCells('A2:J2');
  const subtitleCell4 = wsIntDetails.getCell('A2');
  subtitleCell4.value = 'Task 2 — Integration Detailed Test Cases Ledger';
  subtitleCell4.font = sectionStyle;
  subtitleCell4.fill = headerFill;
  subtitleCell4.alignment = alignCenter;
  wsIntDetails.getRow(2).height = 25;

  wsIntDetails.addRow([]);

  // Headers
  const intDetailHeaders = [
    'Test Case ID', 'Integration Point', 'Description', 'Modules Involved', 
    'Data Flow', 'Pre-condition', 'Test Steps', 'Expected Result', 
    'Actual Result', 'Integration Issues Found'
  ];
  wsIntDetails.addRow(intDetailHeaders);
  const intDetHeaderRow = wsIntDetails.getRow(4);
  intDetHeaderRow.height = 28;
  intDetHeaderRow.eachCell((cell) => {
    cell.font = headerStyle;
    cell.fill = headerFill;
    cell.alignment = alignCenter;
    cell.border = borderStyle;
  });

  // Populate data
  integrationCases.forEach((item, index) => {
    const row = wsIntDetails.addRow([
      item.id,
      item.integrationPoint,
      item.description,
      item.modulesInvolved,
      item.dataFlow,
      item.precondition,
      item.testSteps,
      item.expectedResult,
      item.actualResult,
      item.issuesFound
    ]);

    let maxLines = 1;
    row.values.forEach(val => {
      if (typeof val === 'string') {
        const lines = val.split('\n').length;
        if (lines > maxLines) maxLines = lines;
      }
    });
    row.height = Math.max(25, maxLines * 15 + 10);

    const fill = index % 2 === 0 ? null : zebraFill;
    row.eachCell((cell, colNum) => {
      cell.font = textStyle;
      cell.border = borderStyle;
      cell.alignment = colNum === 1 || colNum === 10 ? { vertical: 'top', horizontal: 'center' } : alignLeftWrap;
      if (fill && colNum !== 10) cell.fill = fill;

      if (colNum === 10) {
        cell.font = { ...textStyle, bold: true, color: { argb: 'FF808080' } }; // grey for None (To be evaluated)
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      }
    });
  });

  wsIntDetails.getColumn(1).width = 15; // ID
  wsIntDetails.getColumn(2).width = 30; // Integration Point
  wsIntDetails.getColumn(3).width = 35; // Description
  wsIntDetails.getColumn(4).width = 25; // Modules Involved
  wsIntDetails.getColumn(5).width = 30; // Data Flow
  wsIntDetails.getColumn(6).width = 30; // Pre-condition
  wsIntDetails.getColumn(7).width = 35; // Test Steps
  wsIntDetails.getColumn(8).width = 40; // Expected Result
  wsIntDetails.getColumn(9).width = 30; // Actual Result
  wsIntDetails.getColumn(10).width = 25; // Issues Found


  // Write to File
  await workbook.xlsx.writeFile(excelPath);
  console.log('Successfully wrote TESTING_DOCUMENT.xlsx');
}

createExcel().catch(err => {
  console.error('Error creating excel file:', err);
  process.exit(1);
});
