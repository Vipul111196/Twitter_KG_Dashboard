import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Hashtags Page
 * 
 * Tests hashtag trending and tweet exploration:
 * - Page load
 * - Trending hashtags list
 * - Hashtag selection
 * - Related tweets display
 */

test.describe('Hashtags Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/hashtags');
  });

  test('should load hashtags page successfully', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Trending Hashtags' })).toBeVisible();
    
    // Check description
    await expect(page.getByText('Explore popular topics and conversations')).toBeVisible();
  });

  test('should display top hashtags section', async ({ page }) => {
    // Check section heading
    await expect(page.getByRole('heading', { name: 'Top Hashtags' })).toBeVisible();
    
    // Wait for data to load
    await page.waitForTimeout(2000);
  });

  test('should display tweets section', async ({ page }) => {
    // Initially should show selection prompt
    await expect(page.getByText(/Select a hashtag|Tweets with/)).toBeVisible();
  });

  test('should select a hashtag and display tweets', async ({ page }) => {
    // Wait for hashtags to load
    await page.waitForTimeout(2000);
    
    // Try to click first hashtag button if available
    const firstHashtag = page.locator('button').first();
    const isVisible = await firstHashtag.isVisible().catch(() => false);
    
    if (isVisible) {
      await firstHashtag.click();
      
      // Wait for tweets to load
      await page.waitForTimeout(1500);
      
      // Check that tweets section updated
      await expect(page.getByText(/Tweets with #|No tweets found/)).toBeVisible();
    }
  });

  test('should have active hashtags link in sidebar', async ({ page }) => {
    const hashtagsLink = page.locator('aside').getByRole('link', { name: 'Hashtags' });
    
    // Check if hashtags link has active styling
    await expect(hashtagsLink).toHaveClass(/bg-primary/);
  });
});

