import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Parse from 'parse/dist/parse.min.js';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  useEffect(() => {
    // Inicializa o Parse com as credenciais do Back4app
    Parse.initialize(
      import.meta.env.VITE_PARSE_APP_ID,
      import.meta.env.VITE_PARSE_JS_KEY
    );
    Parse.serverURL = import.meta.env.VITE_PARSE_SERVER_URL;
    
    console.log('Parse initialized successfully');
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;