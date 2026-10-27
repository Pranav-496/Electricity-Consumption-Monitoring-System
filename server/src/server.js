const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.PORT, () => {
  console.log(`=======================================================`);
  console.log(` Electricity Consumption Monitoring System REST API`);
  console.log(` Port: ${env.PORT}`);
  console.log(` Mode: ${env.NODE_ENV}`);
  console.log(` Base Endpoint: http://localhost:${env.PORT}/api/v1`);
  console.log(` Health Check: http://localhost:${env.PORT}/api/v1/health`);
  console.log(` Live Supabase: ${env.isSupabaseConfigured() ? 'Connected' : 'Standalone Demo Mode'}`);
  console.log(`=======================================================`);
});

const gracefulShutdown = () => {
  console.log('\nShutting down server gracefully...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
