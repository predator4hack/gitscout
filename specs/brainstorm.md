# General Idea of the Project

The application is called gitscout, that helps recruiters discover qualified candidates based on their Github account activity, projects, starts etc. given the job description or technical requirements(eg. "Python ML engineer with experience in distributed systems"), the system generates optimized search queries, uses the GitHub GraphQL/REST APIs to find the relevant developers, and ranks them based on repository patterns. The core matching algorithm analyzes public repos, commit frequency, tech stack alignment and project complexity to score candidates.

GraphQL query that could be useful

```
query {
  search(query: "language:python pytorch in:bio", type: USER, first: 10) {
    userCount
    edges {
      node {
        ... on User {
          login
          name
          email
          bio
          company
          url
          location
          socialAccounts(first: 5) {
            nodes {
              provider
              url
            }
          }
          # Get their pinned items (often where they showcase skills)
          pinnedItems(first: 3) {
            nodes {
              ... on Repository {
                name
                description
                stargazerCount
              }
            }
          }
          # Get their top repositories by stars
          repositories(first: 5, orderBy: {field: STARGAZERS, direction: DESC}) {
            nodes {
              name
              primaryLanguage {
                name
              }
            }
          }
        }
      }
    }
  }
}
```
