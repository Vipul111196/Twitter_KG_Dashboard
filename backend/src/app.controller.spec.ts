import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Neo4jService } from './database/neo4j.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockNeo4jService = {
      executeQuery: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: Neo4jService,
          useValue: mockNeo4jService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API description', () => {
      expect(appController.getHello()).toBe(
        'Twitter Analytics Dashboard API - GraphQL endpoint at /graphql',
      );
    });
  });

  describe('health', () => {
    it('should return health status with neo4j healthy', async () => {
      const result = await appController.getHealth();
      expect(result).toEqual({
        status: 'healthy',
        neo4j: true,
        message: 'All systems operational',
      });
    });
  });
});
