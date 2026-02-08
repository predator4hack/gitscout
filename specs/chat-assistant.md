# Fix chat assistant

## Objective

The objective of this task is as follows:

- the current chat assistant implementation is faulty, when the user asks applying filters, or modify the job requirements, the ai responds with 'Filter Proposal' message with filters that will be applied and estimated candidate results. This is not the expected behavior.
  The expected behavior is:
    1.  When the user asks for any query, there should be follow up questions just the way we get in the claude chat(There can be multiple questions as well). Basically the LLM should clarify the requirements based on the query, and context(previous chat, job search query, the candidates retrieved).

    2.  Once the user clicks on the submit button, once the requirements are clarified, the search query should be modified accordingly and the fresh candidates should be retrieved.

    For example.

    ```

                      User: In addition to having expertise in pytorch, the candidate should also have worked with cuda, and GPU programming

                      AI Agent:
                      1. Are you looking for someone who has written CUDA code or someone who has used CUDA through PyTorch?
                      Option 1. Should have written CUDA code
                      Option 2. Should have at least used CUDA through Pytorch
                      [text box to Allow user to answer apart from the above options]

                      2.
    ```

- The current design, style of the user and chatbot messages aren't aligning as per the dashboard's design, style and layout. I'm providing the HTML of a sample chat conversation between the user and the ai agent. The design of the messages should be like that.

```html
<div class="flex-1 overflow-y-auto pt-4 pr-4 pb-4 pl-4 space-y-6">
    <!-- User Message -->
    <div class="flex flex-col items-end">
        <div class="text-[10px] text-zinc-500 mb-1 mr-1">You</div>
        <div
            class="bg-white text-black text-xs p-3 rounded-xl rounded-tr-sm shadow-lg max-w-[90%] leading-relaxed font-medium"
        >
            Create a custom field called followers that contains the value
            described here: asd. Do this for the top 10 contributors on the
            list.
        </div>
    </div>

    <!-- Steps / Logic -->
    <div class="pl-4 space-y-2.5">
        <div class="flex gap-4 text-[10px] font-mono text-zinc-500">
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                list_contributors
            </div>
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                set_custom_field
            </div>
        </div>
        <div class="flex gap-4 text-[10px] font-mono text-zinc-500">
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                set_custom_field
            </div>
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                set_custom_field
            </div>
        </div>
        <div class="flex gap-4 text-[10px] font-mono text-zinc-500">
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                set_custom_field
            </div>
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                set_custom_field
            </div>
        </div>
        <div class="flex gap-4 text-[10px] font-mono text-zinc-500">
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                set_custom_field
            </div>
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                set_custom_field
            </div>
        </div>
        <div class="flex gap-4 text-[10px] font-mono text-zinc-500">
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                set_custom_field
            </div>
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                set_custom_field
            </div>
        </div>
        <div class="flex gap-4 text-[10px] font-mono text-zinc-500">
            <div
                class="flex items-center gap-2 bg-white/5 border border-white/5 rounded px-2 py-1"
            >
                <span class="w-1.5 h-1.5 rounded-full bg-orange-500/50"></span>
                set_custom_field
            </div>
        </div>
    </div>

    <!-- AI Response -->
    <div class="flex flex-col items-start max-w-[95%]">
        <div class="flex items-center justify-between w-full mb-1">
            <span class="text-[10px] text-zinc-500 ml-1">AI Assistant</span>
            <button class="text-[10px] text-zinc-600 hover:text-zinc-400">
                Copy
            </button>
        </div>
        <div
            class="bg-[#1E2024] border border-white/5 text-zinc-300 text-xs p-3 rounded-xl rounded-tl-sm shadow-sm leading-relaxed font-mono"
        >
            The custom field "followers" with the value "asd" has been
            successfully added to the top 10 contributors.
        </div>
    </div>
</div>
```

---

## Implementation Plan

### Overview
Fix the chat assistant to:
1. Generate LLM-powered contextual clarification questions (not immediate filter proposals)
2. Support Claude-style follow-up UI with option buttons and text input
3. Re-execute search with fresh GitHub API calls after clarifications are answered
4. Update styling to match dashboard's dark theme

---

### Files to Modify

#### Backend

| File | Change |
|------|--------|
| `backend/app/models/chat.py` | Add `MultiClarificationContent` model and `MULTI_CLARIFICATION` message type |
| `backend/app/services/chat/agent.py` | Replace rule-based filter extraction with LLM-powered clarification generation |
| `backend/app/api/chat_routes.py` | Add `/chat/search/refine` endpoint to modify query and fetch fresh candidates |

#### Backend - New Files

| File | Purpose |
|------|---------|
| `backend/app/services/chat/clarification_generator.py` | LLM service to generate contextual clarification questions |
| `backend/app/services/chat/query_modifier.py` | LLM service to modify search query based on user answers |

#### Frontend

| File | Change |
|------|--------|
| `frontend/src/types/dashboard.ts` | Add `MultiClarificationContent` type and update `MessageType` |
| `frontend/src/components/dashboard/sidebar/ChatArea.tsx` | Update message styling to dark theme with new layout |
| `frontend/src/components/dashboard/sidebar/ClarificationMessage.tsx` | Restyle to dark theme with Claude-style option buttons |
| `frontend/src/components/dashboard/sidebar/FilterProposalMessage.tsx` | Restyle to dark theme |
| `frontend/src/api/chat.ts` | Add `refineSearch()` API function |
| `frontend/src/hooks/useChat.ts` | Add handler for multi-clarification completion |

#### Frontend - New Files

| File | Purpose |
|------|---------|
| `frontend/src/components/dashboard/sidebar/FollowUpMessage.tsx` | Claude-style follow-up component with question, option buttons, and text input |

---

### Implementation Steps

#### Step 1: Backend - Add New Models
**File:** `backend/app/models/chat.py`

```python
# Add to MessageType enum
MULTI_CLARIFICATION = "multi_clarification"

# Add new model
class MultiClarificationContent(BaseModel):
    """Multiple clarification questions for Claude-style UI"""
    questions: List[ClarificationQuestion]
    answered: Dict[str, str] = Field(default_factory=dict)
```

Update `ChatMessage` to include `multi_clarification_content` field.

---

#### Step 2: Backend - Create Clarification Generator
**New File:** `backend/app/services/chat/clarification_generator.py`

LLM-powered service that:
- Takes: user query, job description, candidates sample, conversation history
- Uses Gemini/Groq API (follow existing pattern in `backend/app/services/llm/`)
- Returns: List of `ClarificationQuestion` with contextual questions and options

Prompt structure:
```
Given the job requirements and user query, generate 1-3 clarification questions
to better understand filtering needs. Each question should have 3-5 options.

Context:
- Job Description: {jd}
- User Query: {query}
- Current Candidates: {count} found

Return JSON array of questions with options.
```

---

#### Step 3: Backend - Modify ChatAgent Flow
**File:** `backend/app/services/chat/agent.py`

Update `_handle_filter_request()`:

1. Remove immediate `FilterProposal` generation
2. Call `ClarificationGenerator` to get LLM-powered questions
3. Return `MULTI_CLARIFICATION` message type
4. Only generate `FilterProposal` after all clarifications are answered

Flow change:
```
Current:  User Query → FilterExtractor → FilterProposal (immediate)
New:      User Query → ClarificationGenerator (LLM) → Questions → User Answers → QueryModifier → Fresh Search
```

---

#### Step 4: Backend - Create Query Modifier
**New File:** `backend/app/services/chat/query_modifier.py`

LLM service that:
- Takes: original job description, user's clarification answers
- Uses LLM to interpret answers and modify search parameters
- Returns: modified JD spec for re-searching

---

#### Step 5: Backend - Add Refine Search Endpoint
**File:** `backend/app/api/chat_routes.py`

Add `POST /chat/search/refine`:
```python
@router.post("/search/refine")
async def refine_search(
    request: RefineSearchRequest,  # conversation_id, answers
    current_user: CurrentUser
):
    # 1. Get conversation context
    # 2. Use QueryModifier to create new search params
    # 3. Call run_repo_contributors_pipeline() with new params
    # 4. Update session cache with fresh candidates
    # 5. Return new session info
```

---

#### Step 6: Frontend - Update Types
**File:** `frontend/src/types/dashboard.ts`

```typescript
export type MessageType = 'text' | 'filter_proposal' | 'clarification' | 'email_draft' | 'step' | 'multi_clarification';

export interface MultiClarificationContent {
  questions: ClarificationQuestion[];
  answered: Record<string, string>;
}

// Update ChatMessage interface
multi_clarification_content?: MultiClarificationContent | null;
```

---

#### Step 7: Frontend - Create FollowUpMessage Component
**New File:** `frontend/src/components/dashboard/sidebar/FollowUpMessage.tsx`

Claude-style follow-up UI:
```tsx
// Structure (dark theme):
<div className="space-y-4">
  {/* Question text */}
  <p className="text-sm text-zinc-300">{question.question}</p>

  {/* Option buttons as pills/chips */}
  <div className="flex flex-wrap gap-2">
    {question.options.map(opt => (
      <button
        className="px-3 py-1.5 text-xs rounded-full border border-white/10
                   bg-white/5 text-gs-text-muted hover:bg-white/10
                   data-[selected]:bg-gs-purple/20 data-[selected]:border-gs-purple"
      >
        {opt.label}
      </button>
    ))}
  </div>

  {/* Text input for custom answer */}
  <input
    type="text"
    placeholder="Or type your answer..."
    className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10
               rounded-lg text-zinc-300 placeholder:text-gs-text-darker"
  />

  {/* Submit button */}
  <button className="px-4 py-2 bg-gs-purple text-white rounded-lg">
    Continue
  </button>
</div>
```

For multiple questions: Display sequentially or use navigation (Previous/Next).

---

#### Step 8: Frontend - Update ChatArea Styling
**File:** `frontend/src/components/dashboard/sidebar/ChatArea.tsx`

**User Message (right-aligned):**
```tsx
<div className="flex flex-col items-end">
  <div className="text-[10px] text-zinc-500 mb-1 mr-1">You</div>
  <div className="bg-white text-black text-xs p-3 rounded-xl rounded-tr-sm shadow-lg max-w-[90%]">
    {message.text_content}
  </div>
</div>
```

**AI Message (left-aligned):**
```tsx
<div className="flex flex-col items-start max-w-[95%]">
  <div className="flex items-center justify-between w-full mb-1">
    <span className="text-[10px] text-zinc-500 ml-1">AI Assistant</span>
    <button className="text-[10px] text-zinc-600 hover:text-zinc-400">Copy</button>
  </div>
  <div className="bg-[#1E2024] border border-white/5 text-zinc-300 text-xs p-3 rounded-xl rounded-tl-sm font-mono">
    {/* Content based on type */}
  </div>
</div>
```

Add rendering for `multi_clarification` type using `FollowUpMessage` component.

---

#### Step 9: Frontend - Update API and Hook
**File:** `frontend/src/api/chat.ts`

```typescript
export async function refineSearch(
  conversationId: string,
  answers: Record<string, string>
): Promise<{ sessionId: string; totalFound: number }> {
  const response = await apiClient.post('/chat/search/refine', {
    conversation_id: conversationId,
    answers
  });
  return response.data;
}
```

**File:** `frontend/src/hooks/useChat.ts`

Add `handleClarificationComplete()` that:
1. Calls `refineSearch()` API
2. Triggers parent callback to refresh candidates
3. Adds confirmation message to chat

---

#### Step 10: Frontend - Restyle Existing Components

**ClarificationMessage.tsx:** Update from purple/light to dark theme
**FilterProposalMessage.tsx:** Update from blue/light to dark theme

Use consistent dark styling:
- Background: `bg-[#1E2024]`
- Border: `border border-white/5`
- Text: `text-zinc-300`
- Options: `bg-white/5 border-white/10`

---

### Data Flow Summary

```
1. User sends message: "I want candidates with CUDA experience"

2. Backend receives message
   → ClarificationGenerator (LLM) analyzes context
   → Returns questions: "What level of CUDA experience?"

3. Frontend displays FollowUpMessage
   → Shows question with option buttons
   → User selects "Written CUDA kernels" or types custom answer

4. User clicks Continue
   → Frontend calls POST /chat/search/refine with answers

5. Backend processes refinement
   → QueryModifier (LLM) creates new search parameters
   → Calls GitHub API via run_repo_contributors_pipeline()
   → Updates session cache with fresh candidates

6. Frontend receives new session
   → Updates candidate table with fresh results
   → Shows confirmation in chat
```

---

### Key Considerations

1. **LLM Integration:** Follow existing pattern in `backend/app/services/llm/gemini.py`
2. **Error Handling:** Fallback to rule-based extraction if LLM fails
3. **Loading States:** Show typing indicator while LLM generates questions
4. **Rate Limiting:** Re-using search means GitHub API calls - respect rate limits
