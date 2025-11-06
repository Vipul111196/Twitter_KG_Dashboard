/**
 * Query Validator Tests (TDD)
 * Testing multi-layer database protection
 */

import { validateCypherQuery } from './query-validator';

describe('QueryValidator', () => {
  describe('validateCypherQuery - Destructive Operations', () => {
    // Test all DELETE variations
    it('should reject DELETE queries', () => {
      const result = validateCypherQuery('MATCH (n) DELETE n');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('DELETE');
    });

    it('should reject DETACH DELETE queries', () => {
      const result = validateCypherQuery('MATCH (n) DETACH DELETE n');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('DETACH');
    });

    it('should reject delete in lowercase', () => {
      const result = validateCypherQuery('match (n) delete n');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    // Test CREATE operations
    it('should reject CREATE queries', () => {
      const result = validateCypherQuery("CREATE (n:User {name: 'hacker'})");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('CREATE');
    });

    it('should reject create in mixed case', () => {
      const result = validateCypherQuery('Create (n:User)');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    // Test MERGE operations
    it('should reject MERGE queries', () => {
      const result = validateCypherQuery('MERGE (n:User {id: 1})');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('MERGE');
    });

    // Test SET operations
    it('should reject SET queries', () => {
      const result = validateCypherQuery('MATCH (u:User) SET u.followers = 0');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('SET');
    });

    it('should reject set in lowercase', () => {
      const result = validateCypherQuery('match (u:User) set u.name = "evil"');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    // Test REMOVE operations
    it('should reject REMOVE queries', () => {
      const result = validateCypherQuery('MATCH (u:User) REMOVE u.name');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('REMOVE');
    });

    // Test DROP operations
    it('should reject DROP queries', () => {
      const result = validateCypherQuery('DROP CONSTRAINT constraint_name');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('DROP');
    });

    it('should reject DROP INDEX queries', () => {
      const result = validateCypherQuery('DROP INDEX index_name');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('DROP');
    });

    // Test FOREACH operations
    it('should reject FOREACH queries', () => {
      const result = validateCypherQuery(
        'FOREACH (n IN nodes | SET n.flag = true)',
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('FOREACH');
    });

    // Test CALL procedures (dangerous)
    it('should reject CALL procedures', () => {
      const result = validateCypherQuery('CALL dbms.shutdown()');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('CALL');
    });

    it('should reject CALL apoc procedures', () => {
      const result = validateCypherQuery('CALL apoc.periodic.iterate()');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('CALL');
    });
  });

  describe('validateCypherQuery - Valid READ Queries', () => {
    it('should accept simple MATCH...RETURN queries', () => {
      const result = validateCypherQuery('MATCH (u:User) RETURN u LIMIT 10');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept queries with WHERE clause', () => {
      const result = validateCypherQuery(
        'MATCH (u:User) WHERE u.followers > 1000 RETURN u LIMIT 20',
      );
      expect(result.isValid).toBe(true);
    });

    it('should accept queries with ORDER BY', () => {
      const result = validateCypherQuery(
        'MATCH (u:User) RETURN u ORDER BY u.followers DESC LIMIT 10',
      );
      expect(result.isValid).toBe(true);
    });

    it('should accept queries with OPTIONAL MATCH', () => {
      const result = validateCypherQuery(
        'MATCH (u:User) OPTIONAL MATCH (u)-[:POSTS]->(t:Tweet) RETURN u, t LIMIT 5',
      );
      expect(result.isValid).toBe(true);
    });

    it('should accept queries with aggregation functions', () => {
      const result = validateCypherQuery(
        'MATCH (u:User) RETURN count(u) AS userCount',
      );
      expect(result.isValid).toBe(true);
    });

    it('should accept queries with DISTINCT', () => {
      const result = validateCypherQuery(
        'MATCH (u:User)-[:POSTS]->(t:Tweet) RETURN DISTINCT u LIMIT 10',
      );
      expect(result.isValid).toBe(true);
    });

    it('should accept queries with WITH clause', () => {
      const result = validateCypherQuery(
        'MATCH (u:User) WITH u, u.followers AS f WHERE f > 100 RETURN u LIMIT 10',
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCypherQuery - LIMIT Enforcement', () => {
    it('should auto-add LIMIT if missing', () => {
      const result = validateCypherQuery('MATCH (u:User) RETURN u');
      expect(result.isValid).toBe(true);
      expect(result.query).toContain('LIMIT');
      expect(result.query).toContain('20'); // Default limit
    });

    it('should not modify queries that already have LIMIT', () => {
      const originalQuery = 'MATCH (u:User) RETURN u LIMIT 50';
      const result = validateCypherQuery(originalQuery);
      expect(result.isValid).toBe(true);
      expect(result.query).toBe(originalQuery);
    });

    it('should enforce max LIMIT of 100', () => {
      const result = validateCypherQuery('MATCH (u:User) RETURN u LIMIT 200');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('100');
    });

    it('should accept LIMIT of 100', () => {
      const result = validateCypherQuery('MATCH (u:User) RETURN u LIMIT 100');
      expect(result.isValid).toBe(true);
    });

    it('should accept LIMIT less than 100', () => {
      const result = validateCypherQuery('MATCH (u:User) RETURN u LIMIT 50');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCypherQuery - Structure Validation', () => {
    it('should require MATCH clause', () => {
      const result = validateCypherQuery('RETURN 1');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('MATCH');
    });

    it('should require RETURN clause', () => {
      const result = validateCypherQuery('MATCH (u:User)');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('RETURN');
    });

    it('should accept queries with both MATCH and RETURN', () => {
      const result = validateCypherQuery('MATCH (u:User) RETURN u LIMIT 10');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCypherQuery - Real-world Attack Scenarios', () => {
    it('should block attempt to delete all nodes', () => {
      const result = validateCypherQuery('MATCH (n) DETACH DELETE n');
      expect(result.isValid).toBe(false);
    });

    it('should block attempt to create admin user', () => {
      const result = validateCypherQuery(
        'CREATE (u:User {screen_name: "admin", followers: 999999})',
      );
      expect(result.isValid).toBe(false);
    });

    it('should block attempt to modify follower counts', () => {
      const result = validateCypherQuery(
        'MATCH (u:User) SET u.followers = 0 RETURN u',
      );
      expect(result.isValid).toBe(false);
    });

    it('should block attempt to remove constraints', () => {
      const result = validateCypherQuery('DROP CONSTRAINT constraint_9191d2a4');
      expect(result.isValid).toBe(false);
    });

    it('should block attempt to shutdown database', () => {
      const result = validateCypherQuery('CALL dbms.shutdown()');
      expect(result.isValid).toBe(false);
    });

    it('should block sneaky delete in middle of query', () => {
      const result = validateCypherQuery(
        'MATCH (u:User) WHERE u.name CONTAINS "test" DELETE u RETURN count(u)',
      );
      expect(result.isValid).toBe(false);
    });
  });
});
