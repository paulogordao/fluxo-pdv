import { test, expect } from '@playwright/test';
import { TEST_DATA } from './fixtures/test-data';

test.describe('Fluxo de Pagamento com Token - Versão 2 Online', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for API calls
    test.setTimeout(90000); // 90 seconds
  });
  
  test('Deve rejeitar token inválido corretamente', async ({ page }) => {
    // 1. Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    
    // 2. Fill login credentials
    await page.fill('[data-testid="email-input"]', TEST_DATA.email);
    await page.fill('[data-testid="password-input"]', TEST_DATA.password);
    
    // 3. Click login button
    await page.click('[data-testid="login-button"]');
    
    // 4. Wait for navigation to Index page
    await expect(page).toHaveURL('/index', { timeout: 10000 });
    console.log('✓ Login successful - navigated to /index');
    
    // 5. Click "Iniciar Simulação" button
    await page.click('[data-testid="start-button"]');
    
    // 6. Wait for navigation to Welcome page
    await expect(page).toHaveURL('/welcome', { timeout: 5000 });
    console.log('✓ Navigated to welcome screen');
    
    // 7. Click "INICIAR COMPRA" button
    await page.click('button:has-text("INICIAR COMPRA")');
    
    // 8. Wait for navigation to Start page
    await expect(page).toHaveURL('/start', { timeout: 5000 });
    console.log('✓ Navigated to start screen');
    
    // 9. Wait for modal and click "Sim" to participate in Dotz program
    await page.click('button:has-text("Sim")');
    console.log('✓ Selected "Sim" to participate in Dotz program');
    
    // 10. Wait for navigation to CPF page
    await expect(page).toHaveURL('/cpf', { timeout: 5000 });
    console.log('✓ Navigated to CPF screen');
    
    // 11. Fill CPF
    await page.fill('[data-testid="cpf-input"]', TEST_DATA.cpf);
    
    // 12. Click continue button
    await page.click('[data-testid="continue-button"]');
    
    // 13. Wait for API call and navigation to Scan page
    await expect(page).toHaveURL('/scan', { timeout: 30000 });
    console.log('✓ CPF processed - navigated to /scan');
    
    // 14. Select first product from list
    await page.click('[data-testid="product-list-item"]:first-child');
    console.log('✓ Product selected from list');
    
    // 15. Click payment button (which also confirms product)
    await page.click('[data-testid="confirm-product-button"]');
    
    // 16. Wait for navigation to Meios de Pagamento
    await expect(page).toHaveURL('/meios_de_pagamento', { timeout: 30000 });
    console.log('✓ Product confirmed - navigated to /meios_de_pagamento');
    
    // 17. Click first payment option (Pagar com APP)
    await page.click('[data-testid="payment-option"]:first-child');
    console.log('✓ Selected "Pagar com APP" option');
    
    // 18. Wait for navigation to token screen
    await expect(page).toHaveURL('/confirmacao_pagamento_token', { timeout: 30000 });
    console.log('✓ Navigated to token confirmation screen');
    
    // 19. Enter invalid token digit by digit
    for (const digit of TEST_DATA.token.split('')) {
      await page.click(`button:has-text("${digit}")`);
      // Small delay between clicks for stability
      await page.waitForTimeout(100);
    }
    console.log(`✓ Token entered: ${TEST_DATA.token}`);
    
    // 20. Click ENTRAR button
    await page.click('button:has-text("ENTRAR")');
    console.log('✓ Clicked ENTRAR button');
    
    // 21. Wait for validation modal to appear
    await page.waitForSelector('[role="alertdialog"]', { timeout: 30000 });
    console.log('✓ Validation modal appeared');
    
    // 22. Verify modal is visible
    const modal = page.locator('[role="alertdialog"]');
    await expect(modal).toBeVisible();
    
    // 23. Verify modal contains error message (token invalid/error)
    // The modal should contain text indicating token validation failure
    await expect(modal).toContainText(/token|inválido|erro|validação/i);
    console.log('✓ Modal contains expected error message for invalid token');
    
    // SUCCESS: Test passed because system correctly rejected invalid token
    console.log('✅ TEST PASSED: System correctly rejected invalid token and displayed error modal');
  });
  
  test('Deve permitir cancelar durante entrada de token', async ({ page }) => {
    // 1. Login (reuse steps from main test)
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', TEST_DATA.email);
    await page.fill('[data-testid="password-input"]', TEST_DATA.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/index', { timeout: 10000 });
    
    // 2. Navigate through flow to token screen
    await page.click('[data-testid="start-button"]');
    await expect(page).toHaveURL('/welcome', { timeout: 5000 });
    await page.click('button:has-text("INICIAR COMPRA")');
    await expect(page).toHaveURL('/start', { timeout: 5000 });
    await page.click('button:has-text("Sim")');
    await expect(page).toHaveURL('/cpf', { timeout: 5000 });
    await page.fill('[data-testid="cpf-input"]', TEST_DATA.cpf);
    await page.click('[data-testid="continue-button"]');
    await expect(page).toHaveURL('/scan', { timeout: 30000 });
    await page.click('[data-testid="product-list-item"]:first-child');
    await page.click('[data-testid="confirm-product-button"]');
    await expect(page).toHaveURL('/meios_de_pagamento', { timeout: 30000 });
    await page.click('[data-testid="payment-option"]:first-child');
    await expect(page).toHaveURL('/confirmacao_pagamento_token', { timeout: 30000 });
    
    // 3. Enter partial token
    await page.click('button:has-text("1")');
    await page.click('button:has-text("2")');
    await page.click('button:has-text("3")');
    console.log('✓ Entered partial token (123)');
    
    // 4. Click cancel button
    await page.click('button:has-text("Cancelar")');
    console.log('✓ Clicked cancel button');
    
    // 5. Verify navigation back to payment options
    await expect(page).toHaveURL('/meios_de_pagamento', { timeout: 5000 });
    console.log('✅ TEST PASSED: Successfully cancelled and returned to payment options');
  });
});
