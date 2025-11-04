import { gql } from '@apollo/client';
import {
  GET_DASHBOARD_STATS,
  GET_NETWORK_DATA,
  GET_USER,
  SEARCH_USERS,
  GET_TRENDING_HASHTAGS,
} from '@/lib/graphql/queries';

describe('GraphQL Queries', () => {
  it('should define GET_DASHBOARD_STATS query', () => {
    expect(GET_DASHBOARD_STATS).toBeDefined();
    expect(GET_DASHBOARD_STATS.kind).toBe('Document');
  });

  it('should define GET_NETWORK_DATA query', () => {
    expect(GET_NETWORK_DATA).toBeDefined();
    expect(GET_NETWORK_DATA.kind).toBe('Document');
  });

  it('should define GET_USER query', () => {
    expect(GET_USER).toBeDefined();
    expect(GET_USER.kind).toBe('Document');
  });

  it('should define SEARCH_USERS query', () => {
    expect(SEARCH_USERS).toBeDefined();
    expect(SEARCH_USERS.kind).toBe('Document');
  });

  it('should define GET_TRENDING_HASHTAGS query', () => {
    expect(GET_TRENDING_HASHTAGS).toBeDefined();
    expect(GET_TRENDING_HASHTAGS.kind).toBe('Document');
  });
});

