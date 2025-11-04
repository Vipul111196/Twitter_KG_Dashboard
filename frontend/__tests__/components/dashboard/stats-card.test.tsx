import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Users } from 'lucide-react';

describe('StatsCard', () => {
  it('should render title and value', () => {
    render(
      <StatsCard
        title="Total Users"
        value={1000}
        icon={Users}
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <StatsCard
        title="Total Users"
        value={1000}
        icon={Users}
        description="Registered accounts"
      />
    );

    expect(screen.getByText('Registered accounts')).toBeInTheDocument();
  });

  it('should format large numbers with commas', () => {
    render(
      <StatsCard
        title="Total Users"
        value={1234567}
        icon={Users}
      />
    );

    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('should render string values as-is', () => {
    render(
      <StatsCard
        title="Status"
        value="Active"
        icon={Users}
      />
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});

