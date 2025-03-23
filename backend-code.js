const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Function to scrape Maine breach data
async function maineBreachTable() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.maine.gov/agviewer/content/ag/985235c7-cb95-4be2-8792-a1252b4f8318/list.html');
  
  // Get all report URLs
  const urls = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    return links
      .filter(link => link.href && link.href.length > 100)
      .map(link => link.href);
  });
  
  const dataList = [];
  
  // Visit each URL and gather data
  for (const url of urls) {
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
  
  // Ensure all required columns exist
  const columns = [
    'Entity Name', 'Total number of persons affected (including residents)', 'Street Address', 'City',
    'State, or Country if outside the US', 'Zip Code', 'Name', 'Date(s) Breach Occured',
    'Date Breach Discovered', 'Type of Notification', 'Date(s) of consumer notification',
    'Copy of notice to affected Maine residents', 'URL'
  ];
  
  // Fill missing columns with null
  dataList.forEach(item => {
    columns.forEach(col => {
      if (!(col in item)) {
        item[col] = null;
      }
    });
  });
  
  // Sort by notification date
  dataList.sort((a, b) => {
    const dateA = a['Date(s) of consumer notification'] ? new Date(a['Date(s) of consumer notification']) : new Date(0);
    const dateB = b['Date(s) of consumer notification'] ? new Date(b['Date(s) of consumer notification']) : new Date(0);
    return dateB - dateA;
  });
  
  // Remove duplicates
  const uniqueData = dataList.filter((item, index, self) => 
    index === self.findIndex(t => t.URL === item.URL)
  );
  
  return uniqueData;
}

// Function to scrape Texas breach data
async function texasBreachTable() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://oag.my.site.com/datasecuritybreachreport/apex/DataSecurityReportsPage');
  
  try {
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
    
    // Map column names to match Maine's format
    const mappedData = tableData.map(item => ({
      'Entity Name': item['Company Name'] || null,
      'Entity or Individual Address': item['Address'] || null,
      'City': item['City'] || null,
      'State': item['State'] || null,
      'Zip Code': item['Zip'] || null,
      'Type of Notification': item['Type of Notification'] || null,
      'Total number of persons affected (including residents)': item['Number of Affected Persons'] || null,
      'Notice Provided to Consumers (Y/N)': item['Notice Provided'] || null,
      'Method(s) of Notice to Consumers': item['Notice Method'] || null,
      'Date Published at OAG Website': item['Date Published'] || null,
      'URL': 'https://oag.my.site.com/datasecuritybreachreport/apex/DataSecurityReportsPage'
    }));
    
    await browser.close();
    return mappedData;
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

// Add endpoints for other data sources (Hawaii, Washington, California) similarly

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
