# GrapQL API Limit Fix

## Objective

The objective of this task is to create environment variables that configures the number of candidates, repos that are being retrieved

## Implementation Details

Currently, we are hitting the graphQL API limits which is hampering in the testing, especially at the place where we are retrieving the candidates in 10 batches with 5 candidates each.

I need to you to first understand the part where we are hitting the api limits and create environment variables for the configurations like number of repos to retrieve, # of contributors to retrieve, # of batches etc.
