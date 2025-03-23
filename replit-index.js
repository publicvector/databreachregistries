const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.json());

// Function to scrape Maine breach data
async function maineBreachTable() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://www.maine.gov/agviewer/content/ag/985235c7-cb95-4be2-8792-a1252b4f8318/list.html');
    
    // Get all report URLs
    const urls = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter(link => link.href && link.href.length > 100)
        .map(link => link.href);
    });
    
    const dataList = [];
    
    // Visit each URL and gather data (limit to first 5 for demo purposes)
    for (const url of urls.slice(0, 5)) {
      await page.goto(url);
      
      const data = await page.evaluate(() => {
        const content = document.querySelector('#content');
        if (!content) return null;
        
        const items = content.innerText.split('\n').filter(item => item.includes(': '));
        const dataObj = {URL: window.location.href};
        
        items.forEach(item => {
          const [key, value] = item.split(': ', 2);
          dataObj[key] = value;
        });
        
        return dataObj;
      });
      
      if (data) dataList.push(data);
    }
    
    await browser.close();
    return dataList;
  } catch (error) {
    console.error(`Error scraping Maine data: ${error.message}`);
    await browser.close();
    return [];
  }
}

// Function to scrape Texas breach data
async function texasBreachTable() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('https://oag.my.site.com/datasecuritybreachreport/apex/DataSecurityReportsPage');
    
    // Wait for the last page button to be visible and click it
    await page.waitForSelector('#mycdrs_last', {timeout: 10000});
    await page.click('#mycdrs_last');
    
    // Wait for table to load
    await page.waitForSelector('table', {timeout: 5000});
    
    // Extract table data
    const tableData = await page.evaluate(() => {
      const table = document.querySelector('table');
      if (!table) return [];
      
      const rows = Array.from(table.querySelectorAll('tr'));
      const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.innerText.trim());
      
      return rows.slice(1).map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.innerText.trim());
        const rowData = {};
        
        headers.forEach((header, index) => {
          rowData[header] = cells[index] || null;
        });
        
        return rowData;
      });
    });
    
    await browser.close();
    return tableData;
  } catch (error) {
    console.error(`Error scraping Texas data: ${error.message}`);
    await browser.close();
    return [];
  }
}

// Function to scrape HHS breach data
async function hhsBreachTable() {
  try {
    const response = await axios.get('https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf');
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
      
      tableData.push(rowData);
    });
    
    return tableData;
  } catch (error) {
    console.error(`Error scraping HHS data: ${error.message}`);
    return [];
  }
}

// Define API endpoints
app.get('/api/maine', async (req, res) => {
  try {
    const data = await maineBreachTable();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/texas', async (req, res) => {
  try {
    const data = await texasBreachTable();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hhs', async (req, res) => {
  try {
    const data = await hhsBreachTable();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
