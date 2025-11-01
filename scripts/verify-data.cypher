// Verify Twitter Data Import
// Run these queries to check if data was imported correctly

// Count nodes by type
MATCH (u:User) RETURN 'Users' AS type, count(u) AS count
UNION
MATCH (t:Tweet) RETURN 'Tweets' AS type, count(t) AS count
UNION
MATCH (h:Hashtag) RETURN 'Hashtags' AS type, count(h) AS count;

// Count relationships by type
MATCH ()-[r:POSTED]->() RETURN 'POSTED' AS relationship, count(r) AS count
UNION
MATCH ()-[r:TAGGED]->() RETURN 'TAGGED' AS relationship, count(r) AS count
UNION
MATCH ()-[r:MENTIONS]->() RETURN 'MENTIONS' AS relationship, count(r) AS count
UNION
MATCH ()-[r:FOLLOWS]->() RETURN 'FOLLOWS' AS relationship, count(r) AS count;

// Sample query: Get user with their tweets
MATCH (u:User {username: 'tech_guru'})-[:POSTED]->(t:Tweet)
RETURN u.name AS user, t.text AS tweet
LIMIT 5;

// Sample query: Get top hashtags
MATCH (t:Tweet)-[:TAGGED]->(h:Hashtag)
RETURN h.name AS hashtag, count(t) AS tweet_count
ORDER BY tweet_count DESC
LIMIT 10;

// Sample query: Get users with most followers
MATCH (u:User)
RETURN u.username AS username, u.name AS name, u.followers AS followers
ORDER BY u.followers DESC
LIMIT 5;

