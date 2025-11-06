/**
 * GraphQL Mutations
 */

import { gql } from '@apollo/client';

/**
 * Chat mutation - send natural language query with conversation history
 */
export const CHAT_MUTATION = gql`
  mutation Chat($query: String!, $history: [ChatMessageInput!]) {
    chat(query: $query, history: $history) {
      answer
      cypherQuery
      dataReturned
      executionTime
    }
  }
`;

