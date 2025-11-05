import * as neo4j from 'neo4j-driver';

/**
 * Seed script to populate Neo4j with minimal test data for CI/CD e2e tests
 */
async function seedTestData() {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const username = process.env.NEO4J_USERNAME || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'password';

  console.log('🌱 Starting Neo4j test data seeding...');
  console.log(`📍 Connecting to: ${uri}`);

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

  try {
    const session = driver.session();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');

    // Create Users
    console.log('👥 Creating users...');
    await session.run(`
      CREATE (u1:User {
        id: 'user1',
        screen_name: 'neo4j',
        name: 'Neo4j',
        followers: 50000,
        following: 1000,
        location: 'San Francisco, CA',
        description: 'The Graph Database',
        verified: true,
        created_at: datetime('2023-01-01T00:00:00Z')
      })
      CREATE (u2:User {
        id: 'user2',
        screen_name: 'graphdb',
        name: 'Graph Database',
        followers: 10000,
        following: 500,
        location: 'New York, NY',
        description: 'Graph enthusiast',
        verified: false,
        created_at: datetime('2023-01-02T00:00:00Z')
      })
      CREATE (u3:User {
        id: 'user3',
        screen_name: 'testuser',
        name: 'Test User',
        followers: 100,
        following: 50,
        location: 'London, UK',
        description: 'Testing graphs',
        verified: false,
        created_at: datetime('2023-01-03T00:00:00Z')
      })
    `);

    // Create Tweets
    console.log('🐦 Creating tweets...');
    await session.run(`
      MATCH (u1:User {screen_name: 'neo4j'})
      MATCH (u2:User {screen_name: 'graphdb'})
      MATCH (u3:User {screen_name: 'testuser'})
      
      CREATE (t1:Tweet {
        id: 'tweet1',
        text: 'Neo4j is awesome! #neo4j #graphdb #database',
        created_at: datetime('2023-06-01T10:00:00Z'),
        likes: 100,
        retweets: 50,
        replies: 10
      })
      CREATE (t2:Tweet {
        id: 'tweet2',
        text: 'Learning about graphs with #neo4j',
        created_at: datetime('2023-06-02T11:00:00Z'),
        likes: 50,
        retweets: 20,
        replies: 5
      })
      CREATE (t3:Tweet {
        id: 'tweet3',
        text: 'Graph databases are the future #graphdb',
        created_at: datetime('2023-06-03T12:00:00Z'),
        likes: 75,
        retweets: 30,
        replies: 8
      })
      CREATE (t4:Tweet {
        id: 'tweet4',
        text: 'Testing my first tweet #neo4j',
        created_at: datetime('2023-06-04T13:00:00Z'),
        likes: 10,
        retweets: 2,
        replies: 1
      })
      
      CREATE (u1)-[:POSTED]->(t1)
      CREATE (u2)-[:POSTED]->(t2)
      CREATE (u2)-[:POSTED]->(t3)
      CREATE (u3)-[:POSTED]->(t4)
    `);

    // Create Hashtags
    console.log('🏷️  Creating hashtags...');
    await session.run(`
      CREATE (h1:Hashtag {name: 'neo4j', tweet_count: 3})
      CREATE (h2:Hashtag {name: 'graphdb', tweet_count: 2})
      CREATE (h3:Hashtag {name: 'database', tweet_count: 1})
    `);

    // Create relationships between Tweets and Hashtags
    console.log('🔗 Creating tweet-hashtag relationships...');
    await session.run(`
      MATCH (t1:Tweet {id: 'tweet1'})
      MATCH (t2:Tweet {id: 'tweet2'})
      MATCH (t3:Tweet {id: 'tweet3'})
      MATCH (t4:Tweet {id: 'tweet4'})
      MATCH (h1:Hashtag {name: 'neo4j'})
      MATCH (h2:Hashtag {name: 'graphdb'})
      MATCH (h3:Hashtag {name: 'database'})
      
      CREATE (t1)-[:TAGS]->(h1)
      CREATE (t1)-[:TAGS]->(h2)
      CREATE (t1)-[:TAGS]->(h3)
      CREATE (t2)-[:TAGS]->(h1)
      CREATE (t3)-[:TAGS]->(h2)
      CREATE (t4)-[:TAGS]->(h1)
    `);

    // Create follow relationships
    console.log('👤 Creating follow relationships...');
    await session.run(`
      MATCH (u1:User {screen_name: 'neo4j'})
      MATCH (u2:User {screen_name: 'graphdb'})
      MATCH (u3:User {screen_name: 'testuser'})
      
      CREATE (u2)-[:FOLLOWS]->(u1)
      CREATE (u3)-[:FOLLOWS]->(u1)
      CREATE (u3)-[:FOLLOWS]->(u2)
    `);

    // Verify data
    console.log('✅ Verifying seeded data...');
    const userCount = await session.run(
      'MATCH (u:User) RETURN count(u) as count',
    );
    const tweetCount = await session.run(
      'MATCH (t:Tweet) RETURN count(t) as count',
    );
    const hashtagCount = await session.run(
      'MATCH (h:Hashtag) RETURN count(h) as count',
    );
    const relationshipCount = await session.run(
      'MATCH ()-[r]->() RETURN count(r) as count',
    );

    const userCountValue = userCount.records[0].get('count') as neo4j.Integer;
    const tweetCountValue = tweetCount.records[0].get('count') as neo4j.Integer;
    const hashtagCountValue = hashtagCount.records[0].get(
      'count',
    ) as neo4j.Integer;
    const relationshipCountValue = relationshipCount.records[0].get(
      'count',
    ) as neo4j.Integer;

    console.log(`   Users: ${userCountValue.toNumber()}`);
    console.log(`   Tweets: ${tweetCountValue.toNumber()}`);
    console.log(`   Hashtags: ${hashtagCountValue.toNumber()}`);
    console.log(`   Relationships: ${relationshipCountValue.toNumber()}`);

    await session.close();
    console.log('✨ Test data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await driver.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedTestData;
