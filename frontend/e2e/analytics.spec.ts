import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Analytics Page
 *
 * Tests advanced analytics and insights:
 * - Page load
 * - Stats display
 * - Network metrics
 * - Hashtag analysis
 */

test.describe("Analytics Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/analytics");
  });

  test("should load analytics page successfully", async ({ page }) => {
    // Check main heading
    await expect(
      page.getByRole("heading", { name: "Analytics", exact: true }),
    ).toBeVisible();

    // Check description
    await expect(
      page.getByText("Deep insights into Twitter network data"),
    ).toBeVisible();
  });

  test("should display primary stats", async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check stats labels are visible (use main content area)
    const main = page.getByRole("main");
    await expect(main.getByText("Total Users")).toBeVisible();
    await expect(main.getByText("Total Tweets")).toBeVisible();
    await expect(main.getByText("Avg Tweets/User")).toBeVisible();
  });

  test("should display network metrics section", async ({ page }) => {
    // Check section heading
    await expect(
      page.getByRole("heading", { name: "Network Metrics" }),
    ).toBeVisible();

    // Wait for data
    await page.waitForTimeout(2000);

    // Check metric labels
    await expect(page.getByText("Total Relationships")).toBeVisible();
    await expect(page.getByText("Unique Hashtags")).toBeVisible();
    await expect(page.getByText("Network Density")).toBeVisible();
  });

  test("should display top hashtags analysis", async ({ page }) => {
    // Check section heading
    await expect(
      page.getByRole("heading", { name: "Top Hashtags Analysis" }),
    ).toBeVisible();

    // Wait for data to load
    await page.waitForTimeout(2000);
  });

  test("should have active analytics link in sidebar", async ({ page }) => {
    const analyticsLink = page
      .locator("aside")
      .getByRole("link", { name: "Analytics" });

    // Check if analytics link has active styling
    await expect(analyticsLink).toHaveClass(/bg-primary/);
  });
});
