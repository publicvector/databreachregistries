// Add this function to your server.js file

// Function to scrape Washington breach data
async function washingtonBreachTable() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto("https://www.atg.wa.gov/data-breach-notifications", {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Extract table data
    const tableData = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      if (tables.length === 0) return [];
      
      // Find the correct table (assuming it's the first one with breach data)
      const table = tables[0];
      
      // Get headers
      const headerRow = table.querySelector('tr');
      const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.innerText.trim());
      
      // Get rows
      const rows = Array.from(table.querySelectorAll('tr')).slice(1); // Skip header row
      
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
        const rowData = {};
        
        headers.forEach((header, index) => {
          rowData[header] = cells[index] || null;
        });
        
        // Add URL field for consistency with other datasets
        rowData['URL'] = 'https://www.atg.wa.gov/data-breach-notifications';
        
        return rowData;
      });
    });
    
    await browser.close();
    return tableData;
  } catch (error) {
    console.error(`Error scraping Washington data: ${error.message}`);
    await browser.close();
    return [];
  }
}

// Add this endpoint to your server.js file
app.get('/api/washington', async (req, res) => {
  try {
    const data = await washingtonBreachTable();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
