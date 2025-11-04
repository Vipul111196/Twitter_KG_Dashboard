import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { DashboardStats, NetworkData } from './analytics.types';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => DashboardStats, {
    description: 'Get dashboard statistics',
  })
  async dashboardStats(): Promise<DashboardStats> {
    return this.analyticsService.getDashboardStats();
  }

  @Query(() => NetworkData, {
    description: 'Get network data for visualization',
  })
  async networkData(
    @Args('limit', { type: () => Int, defaultValue: 100 }) limit: number = 100,
    @Args('minFollowers', { type: () => Int, defaultValue: 0 }) minFollowers: number = 0,
    @Args('minHashtagUsage', { type: () => Int, defaultValue: 5 }) minHashtagUsage: number = 5,
  ): Promise<NetworkData> {
    return this.analyticsService.getNetworkData(limit, minFollowers, minHashtagUsage);
  }
}

