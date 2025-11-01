#!/bin/bash
# Load sample Twitter data into Neo4j

echo "🔄 Loading sample Twitter data..."

# Clear existing data
docker exec twitter-neo4j cypher-shell -u neo4j -p password "MATCH (n) DETACH DELETE n;"

# Create Users
docker exec twitter-neo4j cypher-shell -u neo4j -p password "
CREATE (u1:User {id: '1', username: 'john_doe', name: 'John Doe', followers: 1500, following: 300}),
(u2:User {id: '2', username: 'jane_smith', name: 'Jane Smith', followers: 3200, following: 450}),
(u3:User {id: '3', username: 'tech_guru', name: 'Tech Guru', followers: 15000, following: 200}),
(u4:User {id: '4', username: 'data_scientist', name: 'Data Scientist', followers: 8500, following: 600}),
(u5:User {id: '5', username: 'neo4j_fan', name: 'Neo4j Fan', followers: 2100, following: 350}),
(u6:User {id: '6', username: 'graphdb_expert', name: 'Graph DB Expert', followers: 5600, following: 280}),
(u7:User {id: '7', username: 'ai_researcher', name: 'AI Researcher', followers: 12000, following: 150}),
(u8:User {id: '8', username: 'web_developer', name: 'Web Developer', followers: 4200, following: 520}),
(u9:User {id: '9', username: 'cloud_architect', name: 'Cloud Architect', followers: 7800, following: 390}),
(u10:User {id: '10', username: 'startup_founder', name: 'Startup Founder', followers: 9500, following: 420});
"

echo "✅ Users created"

# Create Hashtags
docker exec twitter-neo4j cypher-shell -u neo4j -p password "
CREATE (h1:Hashtag {name: 'neo4j'}),
(h2:Hashtag {name: 'graphdatabase'}),
(h3:Hashtag {name: 'datascience'}),
(h4:Hashtag {name: 'machinelearning'}),
(h5:Hashtag {name: 'ai'}),
(h6:Hashtag {name: 'javascript'}),
(h7:Hashtag {name: 'typescript'}),
(h8:Hashtag {name: 'react'}),
(h9:Hashtag {name: 'cloud'}),
(h10:Hashtag {name: 'devops'});
"

echo "✅ Hashtags created"

# Create Tweets
docker exec twitter-neo4j cypher-shell -u neo4j -p password "
CREATE (t1:Tweet {id: '101', text: 'Just discovered Neo4j and I am amazed by graph databases! #neo4j #graphdatabase', createdAt: datetime('2024-01-15T10:30:00')}),
(t2:Tweet {id: '102', text: 'Working on a new machine learning project using graph algorithms #datascience #machinelearning #neo4j', createdAt: datetime('2024-01-16T14:20:00')}),
(t3:Tweet {id: '103', text: 'TypeScript + React = Perfect combination for modern web development #typescript #react #javascript', createdAt: datetime('2024-01-17T09:15:00')}),
(t4:Tweet {id: '104', text: 'Graph databases are the future of connected data #neo4j #graphdatabase', createdAt: datetime('2024-01-18T16:45:00')}),
(t5:Tweet {id: '105', text: 'Building a recommendation engine with Neo4j, incredible performance! #neo4j #datascience', createdAt: datetime('2024-01-19T11:00:00')}),
(t6:Tweet {id: '106', text: 'AI and graph databases working together for better insights #ai #neo4j #machinelearning', createdAt: datetime('2024-01-20T13:30:00')}),
(t7:Tweet {id: '107', text: 'Deploying Neo4j on cloud infrastructure #cloud #devops #neo4j', createdAt: datetime('2024-01-21T10:00:00')}),
(t8:Tweet {id: '108', text: 'React hooks make state management so much easier #react #javascript', createdAt: datetime('2024-01-22T15:20:00')}),
(t9:Tweet {id: '109', text: 'Graph algorithms for fraud detection in financial systems #neo4j #datascience', createdAt: datetime('2024-01-23T09:45:00')}),
(t10:Tweet {id: '110', text: 'Love how Neo4j handles complex relationships #neo4j #graphdatabase', createdAt: datetime('2024-01-24T14:10:00')}),
(t11:Tweet {id: '111', text: 'Building a knowledge graph for our AI platform #ai #neo4j', createdAt: datetime('2024-01-25T11:30:00')}),
(t12:Tweet {id: '112', text: 'TypeScript strict mode catches so many bugs early #typescript #javascript', createdAt: datetime('2024-01-26T16:00:00')}),
(t13:Tweet {id: '113', text: 'Microservices architecture with graph database backend #cloud #neo4j #devops', createdAt: datetime('2024-01-27T10:45:00')}),
(t14:Tweet {id: '114', text: 'Data science workflows powered by graph analytics #datascience #neo4j', createdAt: datetime('2024-01-28T13:15:00')}),
(t15:Tweet {id: '115', text: 'Next.js + Neo4j = Amazing tech stack #react #javascript #neo4j', createdAt: datetime('2024-01-29T09:30:00')});
"

echo "✅ Tweets created"

# Create relationships in batches
echo "Creating relationships..."

# POSTED relationships
docker exec twitter-neo4j cypher-shell -u neo4j -p password "
MATCH (u1:User {id: '1'}), (t1:Tweet {id: '101'}) CREATE (u1)-[:POSTED]->(t1);
" > /dev/null 2>&1

docker exec twitter-neo4j cypher-shell -u neo4j -p password "
MATCH (u:User), (t:Tweet)
WHERE (u.id = '3' AND t.id = '102') OR
      (u.id = '8' AND t.id = '103') OR
      (u.id = '5' AND t.id = '104') OR
      (u.id = '4' AND t.id = '105') OR
      (u.id = '7' AND t.id = '106') OR
      (u.id = '9' AND t.id = '107') OR
      (u.id = '8' AND t.id = '108') OR
      (u.id = '6' AND t.id = '109') OR
      (u.id = '5' AND t.id = '110') OR
      (u.id = '7' AND t.id = '111') OR
      (u.id = '8' AND t.id = '112') OR
      (u.id = '9' AND t.id = '113') OR
      (u.id = '4' AND t.id = '114') OR
      (u.id = '3' AND t.id = '115')
CREATE (u)-[:POSTED]->(t);
"

echo "✅ POSTED relationships created"

# TAGGED relationships
docker exec twitter-neo4j cypher-shell -u neo4j -p password "
UNWIND [
  ['101', 'neo4j'], ['101', 'graphdatabase'],
  ['102', 'datascience'], ['102', 'machinelearning'], ['102', 'neo4j'],
  ['103', 'typescript'], ['103', 'react'], ['103', 'javascript'],
  ['104', 'neo4j'], ['104', 'graphdatabase'],
  ['105', 'neo4j'], ['105', 'datascience'],
  ['106', 'ai'], ['106', 'neo4j'], ['106', 'machinelearning'],
  ['107', 'cloud'], ['107', 'devops'], ['107', 'neo4j'],
  ['108', 'react'], ['108', 'javascript'],
  ['109', 'neo4j'], ['109', 'datascience'],
  ['110', 'neo4j'], ['110', 'graphdatabase'],
  ['111', 'ai'], ['111', 'neo4j'],
  ['112', 'typescript'], ['112', 'javascript'],
  ['113', 'cloud'], ['113', 'neo4j'], ['113', 'devops'],
  ['114', 'datascience'], ['114', 'neo4j'],
  ['115', 'react'], ['115', 'javascript'], ['115', 'neo4j']
] AS pair
MATCH (t:Tweet {id: pair[0]}), (h:Hashtag {name: pair[1]})
CREATE (t)-[:TAGGED]->(h);
"

echo "✅ TAGGED relationships created"

# MENTIONS relationships
docker exec twitter-neo4j cypher-shell -u neo4j -p password "
UNWIND [
  ['102', '5'], ['103', '3'], ['105', '3'],
  ['106', '4'], ['111', '3'], ['115', '8']
] AS pair
MATCH (t:Tweet {id: pair[0]}), (u:User {id: pair[1]})
CREATE (t)-[:MENTIONS]->(u);
"

echo "✅ MENTIONS relationships created"

# FOLLOWS relationships
docker exec twitter-neo4j cypher-shell -u neo4j -p password "
UNWIND [
  ['1', '3'], ['1', '5'], ['2', '3'], ['2', '7'],
  ['3', '4'], ['4', '3'], ['4', '7'], ['5', '3'],
  ['5', '6'], ['6', '3'], ['6', '5'], ['7', '4'],
  ['8', '3'], ['9', '3'], ['9', '10'], ['10', '7'], ['10', '9']
] AS pair
MATCH (u1:User {id: pair[0]}), (u2:User {id: pair[1]})
CREATE (u1)-[:FOLLOWS]->(u2);
"

echo "✅ FOLLOWS relationships created"
echo ""
echo "🎉 Sample data loaded successfully!"
echo "🌐 Access Neo4j Browser at: http://localhost:7474"
echo "📊 Username: neo4j"
echo "🔐 Password: password"

