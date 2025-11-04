import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Dashboard Page
 * 
 * Tests the main dashboard functionality including:
 * - Page load and navigation
 * - Stats cards display
 * - Trending hashtags
 * - Recent tweets
 */

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load dashboard page successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle('Twitter Analytics Dashboard');
    
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Dashboard Overview' })).toBeVisible();
    
    // Check description
    await expect(page.getByText('Twitter network analytics powered by Neo4j')).toBeVisible();
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Check sidebar exists
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Check logo/title (using heading role)
    await expect(page.getByRole('heading', { name: 'Twitter Analytics' })).toBeVisible();
    
    // Check all navigation links
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Network' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Hashtags' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Analytics' })).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Wait for data to load (max 10 seconds)
    await page.waitForTimeout(2000);
    
    // Check that stats sections are visible (use main content area to avoid sidebar)
    const main = page.getByRole('main');
    await expect(main.getByText('Total Users')).toBeVisible();
    await expect(main.getByText('Total Tweets')).toBeVisible();
    await expect(main.getByText('Hashtags', { exact: true })).toBeVisible();
    await expect(main.getByText('Relationships')).toBeVisible();
  });

  test('should display trending hashtags section', async ({ page }) => {
    // Check section heading
    await expect(page.getByRole('heading', { name: 'Trending Hashtags' })).toBeVisible();
    
    // Wait for data to load
    await page.waitForTimeout(2000);
  });

  test('should display recent tweets section', async ({ page }) => {
    // Check section heading
    await expect(page.getByRole('heading', { name: 'Recent Tweets' })).toBeVisible();
    
    // Wait for data to load
    await page.waitForTimeout(2000);
  });

  test('should have active dashboard link in sidebar', async ({ page }) => {
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    
    // Check if dashboard link has active styling
    await expect(dashboardLink).toHaveClass(/bg-primary/);
  });
});

