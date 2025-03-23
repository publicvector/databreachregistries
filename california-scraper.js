// Add this function to your server.js file

// Function to scrape California breach data
async function californiaBreachTable() {
  try {
    const response = await axios.get('https://oag.ca.gov/privacy/databreach/list');
    const $ = cheerio.load(response.data);
    
    const tableData = [];
    const headers = [];
    
    // Extract headers
    $('table tr:first-child th').each((index, element) => {
      headers.push($(element).text().trim());
    });
    
    // Extract rows
    $('table tr:not(:first-child)').each((rowIndex, row) => {
      const rowData = {};
      
      $(row).find('td').each((colIndex, cell) => {
        rowData[headers[colIndex] || `Column${colIndex}`] = $(cell).text().trim();
      });
      
      // Add URL field for consistency with other datasets
      rowData['URL'] = 'https://oag.ca.gov/privacy/databreach/list';
      
      tableData.push(rowData);
    });
    
    return tableData;
  } catch (error) {
    console.error(`Error scraping California data: ${error.message}`);
    return [];
  }
}

// Add this endpoint to your server.js file
app.get('/api/california', async (req, res) => {
  try {
    const data = await californiaBreachTable();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
