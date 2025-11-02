import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from './neo4j.service';
import { ConfigService } from '@nestjs/config';
import type { Driver } from 'neo4j-driver';

describe('Neo4jService', () => {
  let service: Neo4jService;
  let mockDriver: jest.Mocked<Partial<Driver>>;
  let mockSession: any;

  beforeEach(async () => {
    // Mock Neo4j session
    mockSession = {
      run: jest.fn(),
      close: jest.fn(),
    };

    // Mock Neo4j driver
    mockDriver = {
      session: jest.fn().mockReturnValue(mockSession),
      verifyConnectivity: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    };

    // Mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          NEO4J_URI: 'bolt://localhost:7687',
          NEO4J_USERNAME: 'neo4j',
          NEO4J_PASSWORD: 'password',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Neo4jService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<Neo4jService>(Neo4jService);
    // Inject mock driver
    (service as any).driver = mockDriver;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have a driver instance', () => {
      expect((service as any).driver).toBeDefined();
    });
  });

  describe('executeQuery', () => {
    it('should execute a simple query successfully', async () => {
      // Arrange
      const query = 'RETURN 1 AS result';
      const params = {};
      const mockResult = {
        records: [
          {
            get: jest.fn((key: string) => 1),
            toObject: jest.fn().mockReturnValue({ result: 1 }),
          },
        ],
      };
      mockSession.run.mockResolvedValue(mockResult);

      // Act
      const result = await service.executeQuery(query, params);

      // Assert
      expect(mockDriver.session).toHaveBeenCalled();
      expect(mockSession.run).toHaveBeenCalledWith(query, params);
      expect(mockSession.close).toHaveBeenCalled();
      expect(result.records).toHaveLength(1);
    });

    it('should execute query with parameters', async () => {
      // Arrange
      const query = 'MATCH (u:User {screen_name: $screenName}) RETURN u';
      const params = { screenName: 'neo4j' };
      const mockResult = {
        records: [
          {
            get: jest.fn((key: string) => ({
              properties: {
                screen_name: 'neo4j',
                name: 'Neo4j',
              },
            })),
            toObject: jest.fn().mockReturnValue({
              u: {
                properties: {
                  screen_name: 'neo4j',
                  name: 'Neo4j',
                },
              },
            }),
          },
        ],
      };
      mockSession.run.mockResolvedValue(mockResult);

      // Act
      const result = await service.executeQuery(query, params);

      // Assert
      expect(mockSession.run).toHaveBeenCalledWith(query, params);
      expect(result.records).toHaveLength(1);
    });

    it('should handle empty results', async () => {
      // Arrange
      const query = 'MATCH (u:User {screen_name: $screenName}) RETURN u';
      const params = { screenName: 'nonexistent' };
      const mockResult = {
        records: [],
      };
      mockSession.run.mockResolvedValue(mockResult);

      // Act
      const result = await service.executeQuery(query, params);

      // Assert
      expect(result.records).toHaveLength(0);
    });

    it('should close session even if query fails', async () => {
      // Arrange
      const query = 'INVALID CYPHER QUERY';
      const params = {};
      const error = new Error('Cypher syntax error');
      mockSession.run.mockRejectedValue(error);

      // Act & Assert
      await expect(service.executeQuery(query, params)).rejects.toThrow(
        'Cypher syntax error',
      );
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should throw meaningful error on connection failure', async () => {
      // Arrange
      const query = 'RETURN 1';
      const params = {};
      const error = new Error('Connection refused');
      mockSession.run.mockRejectedValue(error);

      // Act & Assert
      await expect(service.executeQuery(query, params)).rejects.toThrow(
        'Connection refused',
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when database is connected', async () => {
      // Arrange
      mockDriver.verifyConnectivity?.mockResolvedValue(undefined);

      // Act
      const result = await service.healthCheck();

      // Assert
      expect(result).toBe(true);
      expect(mockDriver.verifyConnectivity).toHaveBeenCalled();
    });

    it('should return false when database connection fails', async () => {
      // Arrange
      mockDriver.verifyConnectivity?.mockRejectedValue(
        new Error('Connection failed'),
      );

      // Act
      const result = await service.healthCheck();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close driver connection on module destroy', async () => {
      // Act
      await service.onModuleDestroy();

      // Assert
      expect(mockDriver.close).toHaveBeenCalled();
    });

    it('should handle error gracefully if close fails', async () => {
      // Arrange
      mockDriver.close?.mockRejectedValue(new Error('Close failed'));

      // Act & Assert - should not throw
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should provide helpful error message for authentication failure', async () => {
      // Arrange
      const query = 'RETURN 1';
      const authError = new Error('Authentication failed');
      mockSession.run.mockRejectedValue(authError);

      // Act & Assert
      await expect(service.executeQuery(query, {})).rejects.toThrow(
        'Authentication failed',
      );
    });

    it('should provide helpful error message for syntax errors', async () => {
      // Arrange
      const query = 'INVALID SYNTAX';
      const syntaxError = new Error('Invalid input');
      mockSession.run.mockRejectedValue(syntaxError);

      // Act & Assert
      await expect(service.executeQuery(query, {})).rejects.toThrow(
        'Invalid input',
      );
    });
  });
});

