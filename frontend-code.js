import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { DataGrid } from '@mui/x-data-grid';
import { 
  AppBar, Toolbar, Typography, Container, Box, 
  Tab, Tabs, CircularProgress, Button, Alert
} from '@mui/material';

const API_BASE_URL = 'http://localhost:5000/api';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [maineData, setMaineData] = useState([]);
  const [texasData, setTexasData] = useState([]);
  const [hhsData, setHhsData] = useState([]);
  const [hawaiiData, setHawaiiData] = useState([]);
  const [washingtonData, setWashingtonData] = useState([]);
  const [californiaData, setCaliforniaData] = useState([]);
  
  const [loading, setLoading] = useState({
    maine: false,
    texas: false,
    hhs: false,
    hawaii: false,
    washington: false,
    california: false
  });
  
  const [error, setError] = useState({
    maine: null,
    texas: null,
    hhs: null,
    hawaii: null,
    washington: null,
    california: null
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Function to fetch data from specific source
  const fetchData = async (source) => {
    // Set loading state for this source
    setLoading(prev => ({ ...prev, [source]: true }));
    
    try {
      const response = await axios.get(`${API_BASE_URL}/${source}`);
      
      // Map response data to include IDs for DataGrid
      const dataWithIds = response.data.map((item, index) => ({
        id: index,
        ...item
      }));
      
      // Update state based on source
      switch(source) {
        case 'maine':
          setMaineData(dataWithIds);
          break;
        case 'texas':
          setTexasData(dataWithIds);
          break;
        case 'hhs':
          setHhsData(dataWithIds);
          break;
        case 'hawaii':
          setHawaiiData(dataWithIds);
          break;
        case 'washington':
          setWashingtonData(dataWithIds);
          break;
        case 'california':
          setCaliforniaData(dataWithIds);
          break;
        default:
          break;
      }
      
      // Clear error state
      setError(prev => ({ ...prev, [source]: null }));
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        [source]: `Failed to fetch ${source} data: ${err.message}`
      }));
    } finally {
      setLoading(prev => ({ ...prev, [source]: false }));
    }
  };

  // Function to create columns based on data
  const getColumns = (data) => {
    if (!data || data.length === 0) return [];
    
    // Create columns based on the first item in data
    return Object.keys(data[0])
      .filter(key => key !== 'id') // Filter out the ID column
      .map(key => ({
        field: key,
        headerName: key,
        flex: 1,
        minWidth: 150
      }));
  };

  // Render table for each data source
  const renderTable = (data, source) => {
    if (loading[source]) {
      return <CircularProgress />;
    }
    
    if (error[source]) {
      return <Alert severity="error">{error[source]}</Alert>;
    }
    
    if (!data || data.length === 0) {
      return (
        <Box textAlign="center" p={3}>
          <Typography variant="body1" gutterBottom>
            No data available. Click the button below to fetch data.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => fetchData(source)}
          >
            Fetch {source.charAt(0).toUpperCase() + source.slice(1)} Data
          </Button>
        </Box>
      );
    }
    
    const columns = getColumns(data);
    
    return (
      <Box height={600} width="100%">
        <DataGrid
          rows={data}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50, 100]}
          disableSelectionOnClick
          density="compact"
        />
      </Box>
    );
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">
            Data Breach Reports Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Maine" />
          <Tab label="Texas" />
          <Tab label="HHS" />
          <Tab label="Hawaii" />
          <Tab label="Washington" />
          <Tab label="California" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          {renderTable(maineData, 'maine')}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {renderTable(texasData, 'texas')}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {renderTable(hhsData, 'hhs')}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          {renderTable(hawaiiData, 'hawaii')}
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          {renderTable(washingtonData, 'washington')}
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          {renderTable(californiaData, 'california')}
        </TabPanel>
      </Container>
    </div>
  );
}

export default App;
