# Chat agent

## Objective

The objective of this task is to integrate a chat agent into the application. The user should be able to interact with the chat application and get the results

## Implementation Details

Please go through @README.md file and understand the project. In addition go through the @AISidebar.tsx file and understand the ai chatbot layout. Currently, we have a mock ai chat assistant pannel in the frontend, we need to integrate LLMs and allow user to chat and modify the results fetched.

So the flow should be as mentioned below:

- User asks about some modifications in the results fetched after processing the job requirements provided in the landing('/' page). The AI chatbot asks for any clarifying questions if it has(should not be more than 3 questions)
- If Ai agent has asked clarifying questions, user should be allowed to answer those questions. Provide options for user to select along with custom answer.
- Finally, the AI chatbot should come up with final list of possible filters(user can ask for something that may not be possible in graphql query and that should be excluded) that it is going to apply.
- Any other ask unrelated to filtering the candidates should be handeled gracefully (Standard answer something like cannot answer this question etc)
- The user can also ask the chatbot to draft mail based on the job requirements
