import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import App from './App';
import ErrorPage from './ErrorPage';
import { registerServiceWorker } from './serviceWorkerRegistration';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    ),
    children: [
      {
        path: '',
        lazy: () => import('./Week').then((m) => ({ Component: m.default, loader: m.loader })),
      },
      {
        path: 'week',
        lazy: () => import('./Week').then((m) => ({ Component: m.default, loader: m.loader })),
      },
      {
        path: 'week/:week',
        lazy: () => import('./Week').then((m) => ({ Component: m.default, loader: m.loader })),
      },
      {
        path: 'day/:day',
        lazy: () => import('./Day').then((m) => ({ Component: m.default, loader: m.loader })),
      },
      {
        path: 'config',
        lazy: () => import('./Config').then((m) => ({ Component: m.default, loader: m.loader })),
      },
      {
        path: 'search',
        lazy: () => import('./Search').then((m) => ({ Component: m.default, loader: m.loader })),
      },
    ],
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);

registerServiceWorker();
