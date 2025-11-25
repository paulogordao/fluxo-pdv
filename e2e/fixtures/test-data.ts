/**
 * Test data for E2E tests
 * 
 * This file contains all the test credentials and data
 * used in the E2E test suite.
 */

export const TEST_DATA = {
  // Login credentials for UAT Version 2 ONLINE mode
  email: 'teste_e2e_uat_v2@teste.com',
  password: 'HMdq0xZ8K7mpYo7L2Ljy',
  
  // Customer CPF for testing
  cpf: '32373222884',
  
  // Invalid token (expected to be rejected - SUCCESS scenario)
  token: '182101',
  
  // Base URL for the application
  baseUrl: 'http://localhost:8080'
};
