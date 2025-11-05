import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType({ description: 'Dashboard statistics' })
export class DashboardStats {
  @Field(() => Int, { description: 'Total users' })
  totalUsers: number;

  @Field(() => Int, { description: 'Total tweets' })
  totalTweets: number;

  @Field(() => Int, { description: 'Total hashtags' })
  totalHashtags: number;

  @Field(() => Int, { description: 'Total relationships' })
  totalRelationships: number;
}

@ObjectType({ description: 'Network node for visualization' })
export class NetworkNode {
  @Field({ description: 'Node ID' })
  id: string;

  @Field({ description: 'Node label' })
  label: string;

  @Field({ description: 'Node type' })
  type: string;

  @Field(() => Int, { description: 'Node size/weight', nullable: true })
  size?: number;
}

@ObjectType({ description: 'Network edge for visualization' })
export class NetworkEdge {
  @Field({ description: 'Source node ID' })
  source: string;

  @Field({ description: 'Target node ID' })
  target: string;

  @Field({ description: 'Relationship type' })
  type: string;
}

@ObjectType({ description: 'Network data for graph visualization' })
export class NetworkData {
  @Field(() => [NetworkNode], { description: 'Network nodes' })
  nodes: NetworkNode[];

  @Field(() => [NetworkEdge], { description: 'Network edges' })
  edges: NetworkEdge[];
}
