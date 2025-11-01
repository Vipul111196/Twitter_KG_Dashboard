# Twitter v2 Data Model

## Overview

This document describes the Neo4j graph database schema for the Twitter v2 dataset. The data model represents social network interactions including users, tweets, hashtags, and their relationships.

## Node Types

### User
Represents a Twitter user account.

**Properties:**
- `id` (String): Unique identifier for the user
- `username` (String): User's handle/username
- `name` (String): User's display name
- `followers` (Integer): Number of followers
- `following` (Integer): Number of accounts the user follows

**Example:**
```cypher
(:User {
  id: '1',
  username: 'john_doe',
  name: 'John Doe',
  followers: 1500,
  following: 300
})
```

### Tweet
Represents a tweet/post on Twitter.

**Properties:**
- `id` (String): Unique identifier for the tweet
- `text` (String): Content of the tweet
- `createdAt` (DateTime): Timestamp when tweet was created

**Example:**
```cypher
(:Tweet {
  id: '101',
  text: 'Just discovered Neo4j and I am amazed by graph databases! #neo4j #graphdatabase',
  createdAt: datetime('2024-01-15T10:30:00')
})
```

### Hashtag
Represents a hashtag used in tweets.

**Properties:**
- `name` (String): The hashtag text (without #)

**Example:**
```cypher
(:Hashtag {name: 'neo4j'})
```

## Relationship Types

### POSTED
Connects a User to a Tweet they created.

**Direction:** `(User)-[:POSTED]->(Tweet)`

**Properties:** None

**Meaning:** Indicates authorship of a tweet.

**Example Query:**
```cypher
// Get all tweets by a specific user
MATCH (u:User {username: 'john_doe'})-[:POSTED]->(t:Tweet)
RETURN t.text, t.createdAt
ORDER BY t.createdAt DESC
```

### TAGGED
Connects a Tweet to a Hashtag it contains.

**Direction:** `(Tweet)-[:TAGGED]->(Hashtag)`

**Properties:** None

**Meaning:** Indicates which hashtags are used in a tweet.

**Example Query:**
```cypher
// Get all tweets with a specific hashtag
MATCH (t:Tweet)-[:TAGGED]->(h:Hashtag {name: 'neo4j'})
RETURN t.text, t.createdAt
```

### MENTIONS
Connects a Tweet to a User that was mentioned in it.

**Direction:** `(Tweet)-[:MENTIONS]->(User)`

**Properties:** None

**Meaning:** Indicates user mentions (@username) in tweets.

**Example Query:**
```cypher
// Get all tweets mentioning a specific user
MATCH (t:Tweet)-[:MENTIONS]->(u:User {username: 'jane_smith'})
RETURN t.text, t.createdAt
```

### FOLLOWS
Connects one User to another User they follow.

**Direction:** `(User)-[:FOLLOWS]->(User)`

**Properties:** None

**Meaning:** Represents the follower/following relationship.

**Example Query:**
```cypher
// Get all users that john_doe follows
MATCH (u:User {username: 'john_doe'})-[:FOLLOWS]->(followed:User)
RETURN followed.username, followed.name
```

## Complete Graph Pattern

```
(User)-[:POSTED]->(Tweet)-[:TAGGED]->(Hashtag)
                    |
                    +-[:MENTIONS]->(User)
                    
(User)-[:FOLLOWS]->(User)
```

## Database Indexes

For optimal query performance, the following indexes are created:

```cypher
CREATE INDEX user_id IF NOT EXISTS FOR (u:User) ON (u.id);
CREATE INDEX user_username IF NOT EXISTS FOR (u:User) ON (u.username);
CREATE INDEX tweet_id IF NOT EXISTS FOR (t:Tweet) ON (t.id);
CREATE INDEX hashtag_name IF NOT EXISTS FOR (h:Hashtag) ON (h.name);
```

## Common Query Patterns

### 1. Get User's Social Network
```cypher
MATCH (u:User {username: 'john_doe'})-[:POSTED]->(t:Tweet)
OPTIONAL MATCH (t)-[:TAGGED]->(h:Hashtag)
OPTIONAL MATCH (t)-[:MENTIONS]->(m:User)
RETURN u, t, collect(DISTINCT h) AS hashtags, collect(DISTINCT m) AS mentions
```

### 2. Find Top Users by Tweet Count
```cypher
MATCH (u:User)-[:POSTED]->(t:Tweet)
RETURN u.username, u.name, count(t) AS tweet_count
ORDER BY tweet_count DESC
LIMIT 10
```

### 3. Get Trending Hashtags
```cypher
MATCH (t:Tweet)-[:TAGGED]->(h:Hashtag)
RETURN h.name AS hashtag, count(t) AS usage_count
ORDER BY usage_count DESC
LIMIT 10
```

### 4. Find Influential Users
```cypher
MATCH (u:User)
WITH u, u.followers AS followers, 
     size((u)-[:POSTED]->()) AS tweet_count
RETURN u.username, u.name, followers, tweet_count,
       (followers + tweet_count * 10) AS influence_score
ORDER BY influence_score DESC
LIMIT 10
```

### 5. Get Network Visualization Data
```cypher
// Get users and their connections
MATCH (u1:User)-[r:FOLLOWS]->(u2:User)
RETURN u1, r, u2
LIMIT 100

// Get tweets and their relationships
MATCH (u:User)-[:POSTED]->(t:Tweet)-[:TAGGED]->(h:Hashtag)
RETURN u, t, h
LIMIT 50
```

## Data Statistics (Sample Dataset)

- **Users:** 10
- **Tweets:** 15
- **Hashtags:** 10
- **POSTED relationships:** 15
- **TAGGED relationships:** ~40
- **MENTIONS relationships:** ~6
- **FOLLOWS relationships:** ~17

## Graph Database Benefits

1. **Natural Relationships:** Follows, mentions, and hashtag connections are first-class citizens
2. **Efficient Traversals:** Find paths between users, discover communities
3. **Flexible Schema:** Easy to add new relationship types (RETWEETS, LIKES, etc.)
4. **Social Network Analysis:** Calculate centrality, detect communities, find influencers
5. **Performance:** Relationship queries that would require multiple JOINs in SQL are simple traversals

## Future Enhancements

Potential additions to the data model:
- `RETWEETS` relationship
- `LIKES` relationship
- `REPLIES_TO` relationship
- Tweet properties: retweet_count, like_count, reply_count
- User properties: verified, created_at, bio, location
- Hashtag properties: trending_score, created_at

