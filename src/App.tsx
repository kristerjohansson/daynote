import React from 'react';
import { Outlet, useNavigation } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

const App: React.FC = () => {
  const navigation = useNavigation();

  return (
    <>
      <CssBaseline />
      <Backdrop open={navigation.state !== 'idle'} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
      <Outlet />
    </>
  );
};

export default App;
