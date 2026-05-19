// src/tools/shared/queries.ts

/**
 * GitHub v4 GraphQL queries used by the chat tool surface.
 *
 * Every query selects `rateLimit { remaining resetAt }` so streaming tools
 * (and future per-tool throttling) can read the budget without a second
 * round-trip. See plans/kopilot/apps/github-overhaul.md §7.
 */

export const SEARCH_REPOS_QUERY = /* GraphQL */ `
  query SearchRepos($query: String!, $limit: Int!) {
    search(query: $query, type: REPOSITORY, first: $limit) {
      repositoryCount
      nodes {
        ... on Repository {
          owner {
            login
          }
          name
          nameWithOwner
          description
          defaultBranchRef {
            name
          }
          isPrivate
          primaryLanguage {
            name
          }
          stargazerCount
          url
        }
      }
    }
    rateLimit {
      remaining
      resetAt
    }
  }
`

export const GET_REPO_QUERY = /* GraphQL */ `
  query GetRepo($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      owner {
        login
      }
      name
      nameWithOwner
      description
      defaultBranchRef {
        name
      }
      visibility
      homepageUrl
      url
      primaryLanguage {
        name
      }
      repositoryTopics(first: 25) {
        nodes {
          topic {
            name
          }
        }
      }
      stargazerCount
      forkCount
      issues(states: OPEN) {
        totalCount
      }
      pullRequests(states: OPEN) {
        totalCount
      }
      isArchived
      pushedAt
    }
    rateLimit {
      remaining
      resetAt
    }
  }
`

const ISSUE_CORE_FIELDS = /* GraphQL */ `
  number
  title
  state
  stateReason
  author { login }
  url
  createdAt
  updatedAt
  closedAt
  body
  labels(first: 20) { nodes { name } }
  assignees(first: 20) { nodes { login } }
  comments { totalCount }
`

export const FIND_ISSUE_BY_NUMBER_QUERY = /* GraphQL */ `
  query FindIssueByNumber($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        ${ISSUE_CORE_FIELDS}
      }
    }
    rateLimit { remaining resetAt }
  }
`

export const FIND_ISSUE_BY_QUERY = /* GraphQL */ `
  query FindIssueByQuery($query: String!) {
    search(query: $query, type: ISSUE, first: 1) {
      nodes {
        ... on Issue {
          repository { nameWithOwner }
          ${ISSUE_CORE_FIELDS}
        }
      }
    }
    rateLimit { remaining resetAt }
  }
`

export const GET_ISSUE_QUERY = /* GraphQL */ `
  query GetIssue($owner: String!, $repo: String!, $number: Int!, $commentsLimit: Int!) {
    repository(owner: $owner, name: $repo) {
      issue(number: $number) {
        ${ISSUE_CORE_FIELDS}
        comments(last: $commentsLimit) {
          nodes {
            id
            author { login }
            body
            createdAt
            url
          }
          pageInfo { hasPreviousPage }
        }
      }
    }
    rateLimit { remaining resetAt }
  }
`

export const SEARCH_ISSUES_QUERY = /* GraphQL */ `
  query SearchIssues($query: String!, $limit: Int!) {
    search(query: $query, type: ISSUE, first: $limit) {
      issueCount
      nodes {
        ... on Issue {
          repository { nameWithOwner }
          ${ISSUE_CORE_FIELDS}
        }
      }
    }
    rateLimit { remaining resetAt }
  }
`

const PR_CORE_FIELDS = /* GraphQL */ `
  number
  title
  state
  isDraft
  author { login }
  headRefName
  baseRefName
  url
  createdAt
  updatedAt
  body
  labels(first: 20) { nodes { name } }
  assignees(first: 20) { nodes { login } }
  reviewRequests(first: 20) {
    nodes {
      requestedReviewer {
        ... on User { login }
        ... on Team { combinedSlug }
      }
    }
  }
`

export const FIND_PR_BY_NUMBER_QUERY = /* GraphQL */ `
  query FindPrByNumber($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        ${PR_CORE_FIELDS}
      }
    }
    rateLimit { remaining resetAt }
  }
`

export const FIND_PR_BY_QUERY = /* GraphQL */ `
  query FindPrByQuery($query: String!) {
    search(query: $query, type: ISSUE, first: 1) {
      nodes {
        ... on PullRequest {
          repository { nameWithOwner }
          ${PR_CORE_FIELDS}
        }
      }
    }
    rateLimit { remaining resetAt }
  }
`

/**
 * Composite PR fetch — PR core + recent reviews + last-commit check status +
 * changed-file list, all in one round-trip. Booleans toggle optional sub-
 * selections (REST would need 3+ calls; this is the load-bearing GraphQL win
 * per plan §3 decision #13).
 */
export const GET_PR_COMPOSITE_QUERY = /* GraphQL */ `
  query GetPrComposite(
    $owner: String!
    $repo: String!
    $number: Int!
    $reviewsLimit: Int!
    $withReviews: Boolean!
    $withChecks: Boolean!
    $withFiles: Boolean!
  ) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        ${PR_CORE_FIELDS}
        mergedAt
        mergedBy { login }
        additions
        deletions
        changedFiles
        comments { totalCount }
        reviews(last: $reviewsLimit) @include(if: $withReviews) {
          nodes {
            id
            author { login }
            state
            body
            submittedAt
            url
          }
        }
        commits(last: 1) @include(if: $withChecks) {
          nodes {
            commit {
              statusCheckRollup {
                state
                contexts(first: 50) {
                  nodes {
                    __typename
                    ... on CheckRun {
                      name
                      conclusion
                      detailsUrl
                    }
                    ... on StatusContext {
                      context
                      state
                      targetUrl
                    }
                  }
                }
              }
            }
          }
        }
        files(first: 100) @include(if: $withFiles) {
          nodes {
            path
            additions
            deletions
            changeType
          }
        }
      }
    }
    rateLimit { remaining resetAt }
  }
`

export const SEARCH_PRS_QUERY = /* GraphQL */ `
  query SearchPrs($query: String!, $limit: Int!) {
    search(query: $query, type: ISSUE, first: $limit) {
      issueCount
      nodes {
        ... on PullRequest {
          repository { nameWithOwner }
          ${PR_CORE_FIELDS}
        }
      }
    }
    rateLimit { remaining resetAt }
  }
`
