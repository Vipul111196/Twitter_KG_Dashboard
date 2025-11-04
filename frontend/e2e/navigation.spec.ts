import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Navigation Flow
 * 
 * Tests complete user journey through the application:
 * - Navigation between all pages
 * - Active link states
 * - Page transitions
 * - Complete user flow
 */

test.describe('Navigation Flow', () => {
  test('should navigate through all pages', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
    
    // Navigate to Users
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible();
    await expect(page).toHaveURL('/users');
    
    // Navigate to Network
    await page.getByRole('link', { name: 'Network' }).click();
    await expect(page.getByRole('heading', { name: 'Network Visualization' })).toBeVisible();
    await expect(page).toHaveURL('/network');
    
    // Navigate to Hashtags
    await page.getByRole('link', { name: 'Hashtags' }).click();
    await expect(page.getByRole('heading', { name: 'Trending Hashtags' })).toBeVisible();
    await expect(page).toHaveURL('/hashtags');
    
    // Navigate to Analytics
    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(page.getByRole('heading', { name: 'Analytics', exact: true })).toBeVisible();
    await expect(page).toHaveURL('/analytics');
    
    // Navigate back to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
    await expect(page).toHaveURL('/');
  });

  test('should maintain sidebar visibility across pages', async ({ page }) => {
    await page.goto('/');
    
    const sidebar = page.locator('aside');
    
    // Check sidebar on dashboard (use heading role)
    await expect(sidebar).toBeVisible();
    await expect(sidebar.getByRole('heading', { name: 'Twitter Analytics' })).toBeVisible();
    
    // Navigate and check sidebar persists
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(sidebar).toBeVisible();
    
    await page.getByRole('link', { name: 'Network' }).click();
    await expect(sidebar).toBeVisible();
    
    await page.getByRole('link', { name: 'Hashtags' }).click();
    await expect(sidebar).toBeVisible();
    
    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(sidebar).toBeVisible();
  });

  test('should show correct active state for each page', async ({ page }) => {
    await page.goto('/');
    
    // Dashboard should be active
    const dashboardLink = page.locator('aside').getByRole('link', { name: 'Dashboard' });
    await expect(dashboardLink).toHaveClass(/bg-primary/);
    
    // Navigate to Users and check active state
    await page.getByRole('link', { name: 'Users' }).click();
    const usersLink = page.locator('aside').getByRole('link', { name: 'Users' });
    await expect(usersLink).toHaveClass(/bg-primary/);
    
    // Navigate to Network and check active state
    await page.getByRole('link', { name: 'Network' }).click();
    const networkLink = page.locator('aside').getByRole('link', { name: 'Network' });
    await expect(networkLink).toHaveClass(/bg-primary/);
  });

  test('should display footer on all pages', async ({ page }) => {
    const pages = ['/', '/users', '/network', '/hashtags', '/analytics'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await expect(page.getByText('Powered by Neo4j + GraphQL')).toBeVisible();
    }
  });

  test('complete user journey: search user and explore', async ({ page }) => {
    // Start at dashboard
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
    
    // Navigate to users
    await page.getByRole('link', { name: 'Users' }).click();
    await expect(page).toHaveURL('/users');
    
    // Search for users
    const searchInput = page.getByPlaceholder('Search users by name or @username...');
    await searchInput.fill('neo');
    await page.waitForTimeout(1000);
    
    // Go to network visualization
    await page.getByRole('link', { name: 'Network' }).click();
    await expect(page).toHaveURL('/network');
    await page.waitForTimeout(2000);
    
    // Check hashtags
    await page.getByRole('link', { name: 'Hashtags' }).click();
    await expect(page).toHaveURL('/hashtags');
    
    // View analytics
    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(page).toHaveURL('/analytics');
    
    // Return to dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
  });
});

