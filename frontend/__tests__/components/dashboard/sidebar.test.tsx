import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Sidebar } from "@/components/dashboard/sidebar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

describe("Sidebar", () => {
  // Mock window.matchMedia
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it("should render the logo and title", () => {
    render(<Sidebar />);

    expect(screen.getByText("Twitter Analytics")).toBeInTheDocument();
  });

  it("should render all navigation items", () => {
    render(<Sidebar />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("Hashtags")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("should render footer information", () => {
    render(<Sidebar />);

    expect(screen.getByText("Powered by Neo4j + GraphQL")).toBeInTheDocument();
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`${currentYear} Twitter Analytics`),
    ).toBeInTheDocument();
  });

  it("should have correct navigation links", () => {
    render(<Sidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    const usersLink = screen.getByText("Users").closest("a");
    const networkLink = screen.getByText("Network").closest("a");

    expect(dashboardLink).toHaveAttribute("href", "/");
    expect(usersLink).toHaveAttribute("href", "/users");
    expect(networkLink).toHaveAttribute("href", "/network");
  });
});
