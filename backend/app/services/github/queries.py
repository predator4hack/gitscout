SEARCH_USERS_QUERY = """
query SearchUsers($query: String!, $first: Int!, $after: String) {
  search(query: $query, type: USER, first: $first, after: $after) {
    userCount
    pageInfo { hasNextPage endCursor }
    nodes {
      ... on User {
        login
        name
        url
        avatarUrl
        bio
        location
        company
        followers { totalCount }

        contributionsCollection {
          contributionCalendar { totalContributions }
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
          totalPullRequestReviewContributions
        }

        repositories(first: 8, orderBy: { field: STARGAZERS, direction: DESC }) {
          nodes {
            nameWithOwner
            url
            description
            stargazerCount
            forkCount
            isFork
            pushedAt

            primaryLanguage { name }

            languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
              edges { size node { name } }
            }

            repositoryTopics(first: 8) {
              nodes { topic { name } }
            }
          }
        }
      }
    }
  }
}
"""


SEARCH_REPOS_QUERY = """
query SearchRepos($query: String!, $first: Int!, $after: String) {
  search(query: $query, type: REPOSITORY, first: $first, after: $after) {
    repositoryCount
    pageInfo {
      hasNextPage
      endCursor
    }
    nodes {
      ... on Repository {
        name
        nameWithOwner
        url
        description
        stargazerCount
        forkCount
        isFork
        isArchived
        pushedAt

        owner {
          login
        }

        primaryLanguage {
          name
        }
        languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            size
            node {
              name
            }
          }
        }

        repositoryTopics(first: 8) {
          nodes {
            topic {
              name
            }
          }
        }
      }
    }
  }
}
"""


HYDRATE_USERS_QUERY = """
query HydrateUsers($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on User {
      login
      name
      url
      avatarUrl
      bio
      location
      company
      followers {
        totalCount
      }

      contributionsCollection {
        contributionCalendar {
          totalContributions
        }
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        totalPullRequestReviewContributions
      }

      repositories(first: 8, orderBy: { field: STARGAZERS, direction: DESC }) {
        nodes {
          nameWithOwner
          url
          description
          stargazerCount
          forkCount
          isFork
          pushedAt

          primaryLanguage {
            name
          }
          languages(first: 5, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
              }
            }
          }

          repositoryTopics(first: 8) {
            nodes {
              topic {
                name
              }
            }
          }
        }
      }
    }
  }
}
"""
