import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Network Visualization Page
 * 
 * Tests the interactive network graph including:
 * - Page load
 * - Graph rendering
 * - Controls (slider)
 * - Stats display
 */

test.describe('Network Visualization Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/network');
  });

  test('should load network page successfully', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Network Visualization' })).toBeVisible();
    
    // Check description
    await expect(page.getByText('Explore connections between users, tweets, and hashtags')).toBeVisible();
  });

  test('should display node limit slider', async ({ page }) => {
    // Check slider label
    await expect(page.getByText(/Number of Nodes:/)).toBeVisible();
    
    // Check slider exists
    const slider = page.getByRole('slider');
    await expect(slider).toBeVisible();
  });

  test('should display legend with node types', async ({ page }) => {
    // Check legend items (use main content area with exact match)
    const main = page.getByRole('main');
    await expect(main.getByText('Users', { exact: true })).toBeVisible();
    await expect(main.getByText('Tweets', { exact: true })).toBeVisible();
    await expect(main.getByText('Hashtags', { exact: true })).toBeVisible();
  });

  test('should render network graph', async ({ page }) => {
    // Wait for graph to load
    await page.waitForTimeout(3000);
    
    // Check that graph container exists
    const graphContainer = page.locator('.w-full.h-\\[600px\\]');
    await expect(graphContainer).toBeVisible();
  });

  test('should display network stats', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    // Check stats are visible
    await expect(page.getByText('Total Nodes')).toBeVisible();
    await expect(page.getByText('Total Relationships')).toBeVisible();
  });

  test('should have active network link in sidebar', async ({ page }) => {
    const networkLink = page.locator('aside').getByRole('link', { name: 'Network' });
    
    // Check if network link has active styling
    await expect(networkLink).toHaveClass(/bg-primary/);
  });

  test('should adjust slider value', async ({ page }) => {
    const slider = page.getByRole('slider');
    
    // Get initial value
    const initialValue = await slider.getAttribute('aria-valuenow');
    
    // Move slider
    await slider.focus();
    await slider.press('ArrowRight');
    await slider.press('ArrowRight');
    
    // Check value changed
    const newValue = await slider.getAttribute('aria-valuenow');
    expect(newValue).not.toBe(initialValue);
  });
});

