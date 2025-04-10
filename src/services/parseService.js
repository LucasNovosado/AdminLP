import Parse from 'parse/dist/parse.min.js';

/**
 * Inicializa a conexão com o Parse/Back4app
 */
const initializeParse = () => {
  Parse.initialize(
    import.meta.env.VITE_PARSE_APP_ID,
    import.meta.env.VITE_PARSE_JS_KEY
  );
  Parse.serverURL = import.meta.env.VITE_PARSE_SERVER_URL;
  
  console.log('Parse initialized successfully');
};

export { initializeParse, Parse };