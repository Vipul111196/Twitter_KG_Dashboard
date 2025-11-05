/**
 * Application Configuration
 *
 * Centralizes all environment variables and provides defaults.
 * Follows the principle of "configuration as code" with type safety.
 */
export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),

  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    username: process.env.NEO4J_USERNAME || 'neo4j',
    password: process.env.NEO4J_PASSWORD || 'password',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },

  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});
