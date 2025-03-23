document.addEventListener('DOMContentLoaded', function() {
  // Cache DOM elements
  const elements = {
    maine: {
      loadButton: document.getElementById('loadMaineData'),
      loading: document.getElementById('maineLoading'),
      error: document.getElementById('maineError'),
      tableHeader: document.getElementById('maineTableHeader'),
      tableBody: document.getElementById('maineTableBody')
    },
    texas: {
      loadButton: document.getElementById('loadTexasData'),
      loading: document.getElementById('texasLoading'),
      error: document.getElementById('texasError'),
      tableHeader: document.getElementById('texasTableHeader'),
      tableBody: document.getElementById('texasTableBody')
    },
    hhs: {
      loadButton: document.getElementById('loadHhsData'),
      loading: document.getElementById('hhsLoading'),
      error: document.getElementById('hhsError'),
      tableHeader: document.getElementById('hhsTableHeader'),
      tableBody: document.getElementById('hhsTableBody')
    }
  };

  // Attach event listeners
  elements.maine.loadButton.addEventListener('click', () => fetchData('maine'));
  elements.texas.loadButton.addEventListener('click', () => fetchData('texas'));
  elements.hhs.loadButton.addEventListener('click', () => fetchData('hhs'));

  // Function to fetch data from API
  async function fetchData(source) {
    const el = elements[source];
    
    // Show loading spinner
    el.loading.classList.remove('d-none');
    el.error.classList.add('d-none');
    el.tableHeader.innerHTML = '';
    el.tableBody.innerHTML = '';
    
    try {
      const response = await fetch(`/api/${source}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${source} data: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        el.error.textContent = `No ${source} data available`;
        el.error.classList.remove('d-none');
      } else {
        // Render table
        renderTable(source, data);
      }
    } catch (error) {
      el.error.textContent = error.message;
      el.error.classList.remove('d-none');
    } finally {
      el.loading.classList.add('d-none');
    }
  }

  // Function to render table
  function renderTable(source, data) {
    const el = elements[source];
    
    // Get all unique column names from the data
    const columns = Array.from(
      new Set(
        data.flatMap(item => Object.keys(item))
      )
    );
    
    // Create table header
    const headerHTML = columns.map(column => 
      `<th scope="col">${column}</th>`
    ).join('');
    
    el.tableHeader.innerHTML = headerHTML;
    
    // Create table rows
    const rowsHTML = data.map(item => {
      const cells = columns.map(column => 
        `<td>${item[column] || ''}</td>`
      ).join('');
      
      return `<tr>${cells}</tr>`;
    }).join('');
    
    el.tableBody.innerHTML = rowsHTML;
  }

  // Initialize tooltips and popovers
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});
