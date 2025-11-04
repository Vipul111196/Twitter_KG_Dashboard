'use client';

import { ApolloProvider as ApolloProviderBase } from '@apollo/client/react';
import { apolloClient } from './apollo-client';

/**
 * Apollo Provider Component
 * 
 * Wraps the application with Apollo Client context.
 * Must be used in client components only (Next.js 14).
 */
export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProviderBase client={apolloClient}>
      {children}
    </ApolloProviderBase>
  );
}

