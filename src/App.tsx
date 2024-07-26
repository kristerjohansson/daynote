import React from 'react';
import { Outlet } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

const App: React.FC = () => (
  <>
    <CssBaseline />
    <Outlet />
  </>
);

export default App;
