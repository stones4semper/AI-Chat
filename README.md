BUILD A WORLD-CLASS LOCAL AI WORKSPACE FOR OLLAMA




 ## YOUR ROLE




 Act as a world-class product engineering and UI/UX team responsible for building a production-grade AI application.




 You are simultaneously:




 - Principal React engineers

- Senior TypeScript engineers

- Senior frontend architects

- World-class product designers

- Design-system engineers

- AI application engineers

- UX researchers

- Accessibility specialists

- Performance engineers

- Developer-experience engineers




 Approach every decision as if you are building a product for millions of users.




 The final application must feel like a premium, polished, professional AI product, not a prototype, hackathon project, generic SaaS dashboard, or basic ChatGPT clone.




 Use excellent judgment when requirements are not explicitly specified.




 Prioritize:




 1. User experience

2. Visual quality

3. Simplicity

4. Performance

5. Accessibility

6. Maintainability

7. Extensibility

8. Real Ollama integration




---




 # PRODUCT NAME




 Use a tasteful temporary product name such as:




 LocalAI




 The application name should be easy to change later.




 Create a simple, modern application logo/icon that visually communicates:




 - Local AI

- Intelligence

- Privacy

- Technology




 Do not use an overly complicated logo.




---




 # PRODUCT VISION




 Build a local AI chat workspace for users who have Ollama installed on their computer.




 The application provides a beautiful interface for interacting with locally installed AI models.




 The user should be able to:




 - Connect to Ollama

- See Ollama connection status

- Automatically discover installed models

- Switch between models

- Start conversations

- Continue conversations

- Search conversations

- Rename conversations

- Pin conversations

- Archive conversations

- Delete conversations

- Duplicate conversations

- Stream AI responses

- Stop generation

- Regenerate responses

- Edit messages

- Copy responses

- Copy code

- Configure the Ollama server

- Configure AI settings

- Configure a system prompt

- Set a default model

- Change themes

- Export conversations

- Import conversations

- Use keyboard shortcuts

- Use the application on desktop, tablet, and mobile




 The overall product feeling should be:




 > A private, beautiful, professional AI workspace powered by models running directly on the user's computer.




---




 # TECHNOLOGY




 Build the application with:




 - Vite

- React

- TypeScript

- Tailwind CSS

- Modern React architecture

- Reusable components

- Strong TypeScript typing

- Responsive design

- Accessible UI




 Use modern best practices.




 Avoid unnecessary dependencies.




 Do not over-engineer.




---




 # IMPORTANT: THIS IS A REAL OLLAMA APPLICATION




 Do NOT create fake AI responses.




 Do NOT create fake model lists.




 Do NOT simulate Ollama connectivity.




 Do NOT hard-code Qwen as the only model.




 The application must be architected around a real Ollama installation.




 Default Ollama server:




```

http://localhost:11434

```




 The server URL must be configurable.




---




 # OLLAMA API ARCHITECTURE




 Create a dedicated Ollama API service.




 Example:




```

src/

  api/

    ollama.ts

```




 React components must not contain scattered raw Ollama `fetch()` logic.




 Create typed functions for operations such as:




```

checkConnection()

getModels()

getModelInfo(model)

chat(...)

```




 Keep the API abstraction independent from UI components.




---




 # OLLAMA CAPABILITIES




 The application should support:




 - Connection checking

- Model discovery

- Model information

- Chat requests

- Streaming responses

- Model selection

- Conversation context

- Error handling

- Refreshing models

- Aborting generation where supported




 Use Ollama's actual API behavior.




 Do not invent unsupported API functionality.




---




 # CORE FEATURE: MODEL SWITCHING




 ## MODEL SWITCHING IS A FIRST-CLASS FEATURE




 This is one of the most important requirements.




 The user must be able to switch between locally installed Ollama models directly from the main chat interface.




 Do NOT hide model switching inside Settings.




 Do NOT make users create a new conversation just to change models.




 Do NOT hard-code a single Qwen model.




---




 # DYNAMIC MODEL DISCOVERY




 When the application loads, query Ollama for installed models.




 For example, the user's computer might contain:




```

qwen3:8b

qwen3:14b

qwen2.5:7b

llama3.1:8b

mistral:7b

gemma3:12b

```




 The application must dynamically discover whatever models are installed.




 If tomorrow the user installs:




```

deepseek-r1:14b

```




 the application should be able to discover it after refreshing/reloading.




 Never assume which models the user has installed.




---




 # MODEL SELECTOR




 The currently selected model must always be visible in the chat header.




 Example:




```

┌──────────────────────────────────────────────────────┐

│ React Architecture                  Qwen3:8b  ▼  ••• │

└──────────────────────────────────────────────────────┘

```




 Clicking the model opens a premium model picker.




---




 # MODEL PICKER DESIGN




 The model picker should feel like a high-quality command palette/popover.




 Example:




```

┌───────────────────────────────────────┐

│ Select model                          │

│                                       │

│ 🔍 Search models...                   │

│                                       │

│ ✓ Qwen3:8b                            │

│   Qwen • 8 GB                         │

│                                       │

│   Qwen3:14b                           │

│   Qwen • 14 GB                        │

│                                       │

│   Llama3.1:8b                         │

│   Meta • 8 GB                         │

│                                       │

│   Mistral:7b                          │

│   Mistral • 7 GB                      │

│                                       │

│ ───────────────────────────────────── │

│ ↻ Refresh models                      │

│ ⚙ Model settings                      │

└───────────────────────────────────────┘

```




 Features:




 - Search

- Keyboard navigation

- Current-model checkmark

- Model name

- Model family if available

- Model size if available

- Metadata where available

- Loading state

- Empty state

- Refresh button

- Accessible focus management




---




 # MODEL SWITCHING INSIDE A CONVERSATION




 Users must be able to change models at any point in an existing conversation.




 Example:




```

Conversation:




User:

Explain React hooks.




Qwen3:8b:

React hooks are...




User:

Give me a more advanced explanation.




[ Qwen3:8b ▼ ]




Select:

Llama3.1:8b




User:

Compare useMemo and useCallback.

```




 The conversation must remain intact.




 Do NOT delete previous messages.




 Do NOT reset the conversation.




 The newly selected model should handle subsequent requests.




---




 # MODEL PER CONVERSATION




 Every conversation should remember its current model.




 Use a structure such as:




```

type Conversation = {

  id: string;

  title: string;

  model: string;

  createdAt: string;

  updatedAt: string;

  pinned: boolean;

  archived: boolean;

  messages: Message[];

};

```




 When the user opens an existing conversation:




 - Restore messages

- Restore selected model

- Restore conversation title

- Restore relevant state




---




 # MODEL INDICATOR ON ASSISTANT MESSAGES




 Show which model generated an assistant response when useful.




 Example:




```

Qwen3:8b




React Server Components are...




--------------------------------




Llama3.1:8b




The key difference is...

```




 This is important because users may compare different local models.




---




 # MODEL UNAVAILABLE STATE




 If a conversation references a model that is no longer installed:




 Show:




```

Model unavailable




This conversation was using:




qwen3:8b




That model is not currently available

in your Ollama installation.




[ Select another model ]

```




 Do not break the conversation.




 Allow the user to select another installed model.




---




 # DEFAULT MODEL




 Users can select a default model in Settings.




 When creating a new conversation:




 - Use the configured default model

- If no default exists, use a sensible available model

- Allow changing the model before sending the first message




 Remember the user's model preference locally.




---




 # MODEL REFRESH




 Provide a refresh action.




 When the user clicks:




```

↻ Refresh models

```




 query Ollama again.




 Show a subtle loading indicator.




 If a newly installed model appears, it should immediately become available.




---




 # MODEL MANAGEMENT




 Create a Model section in Settings.




 Show:




 - Installed models

- Model name

- Size

- Family

- Modified date where available

- Default model

- Refresh models




 Architect this area so future functionality can be added.




 Potential future functionality:




 - Pull model

- Delete model

- Model details

- Model capabilities




 Do not fake these features now.




 Only implement functionality supported by the actual Ollama API.




---




 # APPLICATION LAYOUT




 Use a professional three-region layout:




```

┌────────────────┬───────────────────────────────────────┐

│                │                                       │

│                │             CHAT HEADER               │

│                │                                       │

│    SIDEBAR     │             MESSAGES                  │

│                │                                       │

│                │                                       │

│                │             COMPOSER                  │

│                │                                       │

└────────────────┴───────────────────────────────────────┘

```




 The conversation should be the primary focus.




---




 # SIDEBAR




 Create a beautiful collapsible sidebar.




 ## Sidebar Header




 Include:




 - Application logo

- Application name

- Collapse button




 ## New Chat




 Prominent button:




```

+ New Chat

```




 This should be one of the most obvious actions.




---




 # SIDEBAR SEARCH




 Include conversation search.




 Placeholder:




```

Search conversations...

```




 Keyboard shortcut:




```

⌘ K

```




 or:




```

Ctrl K

```




 Search:




 - Conversation titles

- Message content

- Model names




---




 # PINNED CONVERSATIONS




 Create a pinned section.




 Pinned conversations should remain near the top.




 Allow:




 - Pin

- Unpin




---




 # CONVERSATION HISTORY




 Group conversations:




```

Today




Yesterday




Previous 7 Days




Previous 30 Days




Older

```




 Each item should show:




 - Title

- Optional model

- Relative time

- Hover actions




---




 # CONVERSATION ACTIONS




 Provide a context menu:




```

Rename

Pin

Archive

Duplicate

Delete

```




 Use confirmation before destructive deletion.




 Allow inline renaming.




---




 # SIDEBAR FOOTER




 Include:




 - Ollama connection indicator

- Settings

- Keyboard shortcuts




 Example:




```

● Ollama Connected




⚙ Settings

⌨ Keyboard shortcuts

```




---




 # COLLAPSIBLE SIDEBAR




 Desktop:




 - Expand/collapse




 Collapsed state:




 - Show icons

- Use tooltips

- Keep New Chat accessible




 Mobile:




 - Convert sidebar into a drawer

- Open using menu button

- Close appropriately




---




 # CHAT HEADER




 The main chat header should include:




 - Conversation title

- Model selector

- Ollama connection status

- More actions




 Example:




```

React Architecture




Qwen3:8b ▼                      ● Local    •••

```




 The model selector must be prominent.




---




 # EMPTY CHAT EXPERIENCE




 When a new conversation has no messages, create a beautiful empty state.




 Example:




```

Your local AI workspace




Chat privately with AI models

running directly on your computer.




[ Explain a concept ]




[ Help me write code ]




[ Analyze some text ]




[ Brainstorm an idea ]

```




 Suggested prompts should send using the currently selected model.




 Do not make this feel like a generic placeholder.




---




 # CHAT EXPERIENCE




 The chat should be spacious and highly readable.




 Do not use huge message bubbles.




 The interface should feel like a premium AI product.




---




 # USER MESSAGE




 User messages should include:




 - Message content

- Copy

- Edit

- Appropriate timestamp/metadata




 Keep them visually distinct but minimal.




---




 # ASSISTANT MESSAGE




 Assistant messages should support:




 - Markdown

- Headings

- Paragraphs

- Lists

- Tables

- Blockquotes

- Inline code

- Code blocks

- Links

- Syntax highlighting




 Actions:




 - Copy

- Regenerate

- Other appropriate actions




---




 # MARKDOWN




 Render AI output beautifully.




 Pay attention to:




 - Typography

- Spacing

- Heading hierarchy

- Lists

- Code

- Tables

- Quotes




 Long responses must remain pleasant to read.




---




 # CODE BLOCKS




 Code blocks are a critical feature.




 Support:




 - Syntax highlighting

- Language indicator

- Copy button

- Horizontal scrolling

- Proper spacing




 Example:




```

┌────────────────────────────────────────────┐

│ TypeScript                         Copy    │

├────────────────────────────────────────────┤

│ const result = await fetchData();         │

│                                            │

│ console.log(result);                      │

└────────────────────────────────────────────┘

```




---




 # STREAMING RESPONSES




 Ollama responses must stream progressively.




 Do not wait for the entire response.




 While generating:




 - Render tokens progressively

- Keep the UI responsive

- Show a subtle generation indicator

- Provide Stop




 Example:




```

Qwen3:8b




React Server Components allow...




[ Stop generating ]

```




---




 # STOP GENERATION




 While generating, replace Send with:




```

■ Stop

```




 Stopping generation must preserve the content generated so far.




---




 # CHAT COMPOSER




 Create a premium bottom composer.




 Features:




 - Multi-line input

- Auto-growing textarea

- Enter to send

- Shift + Enter for newline

- Send button

- Stop button

- Disabled state

- Focus state




 Example:




```

┌───────────────────────────────────────────────┐

│ Ask your local AI anything...                 │

│                                               │

│                                      Send ↑   │

└───────────────────────────────────────────────┘




Qwen3:8b • Local AI • Ollama

```




---




 # SMART SCROLLING




 Implement intelligent scrolling.




 During streaming:




 If the user is near the bottom:




 - Automatically follow the response.




 If the user scrolls upward:




 - Stop automatic scrolling.




 Show:




```

↓ Jump to latest

```




 when appropriate.




 This should feel like a premium AI chat application.




---




 # CONVERSATION PERSISTENCE




 Persist conversations locally.




 Prefer:




 - IndexedDB




 LocalStorage can be used for small preferences.




 Persist:




 - Conversations

- Messages

- Model selection

- Titles

- Pinned state

- Archived state

- User preferences




 Create a storage abstraction.




 The architecture should allow replacing local storage with a backend/database later.




---




 # CONVERSATION TITLE GENERATION




 Initially:




```

New conversation

```




 After the first user message, generate a simple deterministic title from the message.




 Example:




 User:




```

How does React reconciliation work?

```




 Title:




```

React reconciliation

```




 Do not call the model unnecessarily just to generate a title in the first implementation.




 Architect it so AI-generated titles can be introduced later.




---




 # SEARCH




 Search should be fast.




 Search across:




 - Titles

- Message content

- Models




 Show useful results.




 Example:




```

Search conversations




React architecture

Qwen3:8b

Yesterday




Building my portfolio

Llama3.1:8b

Monday

```




---




 # SETTINGS




 Create a polished Settings experience.




 Use a clear settings navigation.




 Sections:




 ## General




 - Default model

- Enter-to-send

- Sidebar behavior




 ## Models




 - Installed models

- Default model

- Refresh models

- Model details




 ## Ollama




 - Server URL

- Connection status

- Test connection

- Retry




 Default:




```

http://localhost:11434

```




 ## AI




 Where supported:




 - System prompt

- Temperature

- Context settings

- Other supported Ollama/model parameters




 Do not expose settings that do not actually work.




 ## Appearance




 - Light

- Dark

- System




 ## Data




 - Export conversations

- Import conversations

- Clear conversations




 Destructive operations require confirmation.




---




 # OLLAMA CONNECTION STATUS




 Show connection state throughout the application.




 States:




```

● Connected

● Connecting

● Offline

```




 Use appropriate colors and subtle indicators.




 When offline:




```

Ollama is offline




Make sure Ollama is running on your computer.




[ Retry connection ]

```




 The application should still allow users to:




 - Browse conversations

- Read old conversations

- Open settings

- Change UI preferences




---




 # ERROR HANDLING




 Handle gracefully:




 - Ollama unavailable

- CORS failure

- Network failure

- Timeout

- Model unavailable

- Empty model list

- Streaming failure

- Invalid API response

- Interrupted generation




 Use friendly messages.




 Never dump raw stack traces into the UI.




---




 # OLLAMA EMPTY MODEL STATE




 If Ollama is connected but no models are available:




 Show:




```

No models installed




Ollama is connected, but there are no

models available yet.




Install a model with Ollama and refresh.




[ Refresh models ]

```




 Do not pretend a model exists.




---




 # RESPONSIVE DESIGN




 The application must be excellent on:




 - Desktop

- Laptop

- Tablet

- Mobile




 Desktop:




 - Persistent sidebar

- Wide chat

- Comfortable content width




 Tablet:




 - Collapsible sidebar




 Mobile:




 - Sidebar drawer

- Full-width chat

- Compact header

- Accessible model selector

- Bottom composer

- Touch-friendly controls




 Avoid horizontal scrolling.




---




 # MOBILE MODEL SWITCHING




 Model switching must remain easy on mobile.




 Do not hide it several levels deep.




 The chat header should contain an accessible model selector.




 The model picker should fit within the viewport.




---




 # DESIGN SYSTEM




 Create a coherent design system.




 Define reusable:




 - Colors

- Typography

- Spacing

- Radius

- Shadows

- Borders

- Focus states

- Component states




 Do not randomly style each component.




---




 # VISUAL DIRECTION




 The visual language should be:




 - Minimal

- Premium

- Sophisticated

- Technical

- Calm

- Modern

- Professional




 Think:




 > A high-end developer tool combined with a premium AI assistant.




 Avoid:




 - Generic SaaS dashboard look

- Excessive gradients

- Rainbow colors

- Excessive glassmorphism

- Excessive shadows

- Cartoon-like rounded UI

- Huge hero sections

- Visual clutter




---




 # DARK THEME




 The default should be a sophisticated dark theme.




 Use:




 - Near-black main background

- Slightly lighter sidebar

- Subtle borders

- High-contrast primary text

- Muted secondary text

- One tasteful accent




 The dark theme should feel expensive and refined.




---




 # LIGHT THEME




 Also provide a beautiful light theme.




 Do not simply invert colors.




 Design the light theme intentionally.




---




 # TYPOGRAPHY




 Use a modern, highly readable sans-serif.




 Prioritize long-form AI responses.




 Use:




 - Comfortable line height

- Excellent paragraph spacing

- Clear headings

- Readable content width

- Strong code typography




 Do not allow text to span the entire monitor.




---




 # ANIMATION




 Use subtle, intentional animations.




 Examples:




 - Sidebar transitions

- Drawer transitions

- Popover transitions

- Message appearance

- Streaming indicator

- Toasts

- Dialogs

- Hover states




 Animations should be fast and polished.




 Do not over-animate the application.




---




 # ACCESSIBILITY




 Accessibility is required.




 Implement:




 - Semantic HTML

- Keyboard navigation

- Visible focus states

- ARIA labels

- Accessible dialogs

- Accessible menus

- Screen reader support

- Proper contrast

- Touch-friendly targets




 The model selector must be keyboard accessible.




---




 # KEYBOARD SHORTCUTS




 Implement:




```

Ctrl/Cmd + K

Search conversations




Ctrl/Cmd + Shift + O

New chat




Escape

Close dialogs/sidebar




Enter

Send message




Shift + Enter

New line

```




 Create a keyboard shortcut help dialog.




---




 # TOAST NOTIFICATIONS




 Use polished toasts for:




 - Ollama connected

- Ollama disconnected

- Model changed

- Conversation renamed

- Conversation deleted

- Conversation pinned

- Conversation archived

- Message copied

- Settings saved




 Keep notifications subtle.




---




 # CONTEXT MENUS




 Use context menus where appropriate.




 Conversation:




```

Rename

Pin

Archive

Duplicate

Delete

```




 Message:




```

Copy

Edit

Regenerate

```




 Do not overload menus with unnecessary options.




---




 # EXPORT




 Allow users to export conversations.




 Use JSON as the initial format.




 Example:




```

{

  "version": 1,

  "conversation": {

    "id": "...",

    "title": "...",

    "model": "...",

    "messages": []

  }

}

```




 Validate data when importing.




---




 # IMPORT




 Allow users to import previously exported conversations.




 Handle:




 - Invalid files

- Unsupported versions

- Missing fields




 Gracefully.




---




 # PRIVACY UX




 The application is designed around local Ollama usage.




 Use subtle copy such as:




```

Local AI




Powered by models running on your computer.

```




 Do not make unsupported security/privacy guarantees.




---




 # PROJECT STRUCTURE




 Use a clean architecture similar to:




```

src/

├── api/

│   └── ollama.ts

│

├── components/

│   ├── ui/

│   ├── chat/

│   ├── sidebar/

│   ├── models/

│   ├── settings/

│   └── layout/

│

├── features/

│   ├── chat/

│   ├── conversations/

│   ├── models/

│   └── settings/

│

├── hooks/

│   ├── useOllama.ts

│   ├── useChat.ts

│   ├── useModels.ts

│   └── useConversations.ts

│

├── layouts/

│   └── AppLayout.tsx

│

├── pages/

│   └── ChatPage.tsx

│

├── store/

│   └── ...

│

├── types/

│   ├── chat.ts

│   ├── ollama.ts

│   ├── model.ts

│   └── conversation.ts

│

├── lib/

│   └── ...

│

└── App.tsx

```




 Adapt this if there is a better architecture.




---




 # TYPES




 Use strong TypeScript.




 Example:




```

type MessageRole = "user" | "assistant" | "system";




type Message = {

  id: string;

  role: MessageRole;

  content: string;

  createdAt: string;

  model?: string;

};




type Conversation = {

  id: string;

  title: string;

  model: string;

  createdAt: string;

  updatedAt: string;

  pinned: boolean;

  archived: boolean;

  messages: Message[];

};

```




 Create appropriate types for:




 - Ollama models

- API responses

- connection status

- generation state

- settings

- errors




 Avoid unnecessary `any`.




---




 # STATE MANAGEMENT




 Separate state into logical categories.




 ## UI State




 Examples:




 - Sidebar open

- Search open

- Active dialog

- Theme

- Mobile drawer




 ## Application State




 Examples:




 - Conversations

- Current conversation

- Available models

- Selected model

- Ollama status




 ## Generation State




 Examples:




 - Generating

- Streaming content

- Abort controller

- Generation error




 Do not create one giant state object.




---




 # CUSTOM HOOKS




 Use hooks such as:




```

useOllama()

useModels()

useChat()

useConversations()

```




 Hooks should encapsulate application behavior.




---




 # PERFORMANCE




 The application should remain responsive with:




 - Long conversations

- Large Markdown responses

- Multiple conversations

- Streaming responses

- Many installed models




 Avoid unnecessary re-renders.




 Optimize where it actually matters.




 Do not prematurely over-engineer.




---




 # LOADING STATES




 Create polished loading states for:




 - Ollama connection

- Model discovery

- Conversation history

- Chat generation

- Settings




 Prefer skeletons/spinners appropriate to the context.




 Do not simply display "Loading..." everywhere.




---




 # EMPTY STATES




 Design intentional empty states for:




 - No conversations

- No search results

- No models

- Ollama offline

- No messages

- No archived conversations




 Every empty state should explain what the user can do next.




---




 # ERROR STATES




 Every important feature needs a useful error state.




 Include:




 - Explanation

- Recovery action

- Clear language




 Example:




```

Unable to connect to Ollama




Check that Ollama is running and that

the server URL is correct.




[ Retry connection ]




[ Open Ollama settings ]

```




---




 # NEW USER EXPERIENCE




 On first launch:




 Check Ollama automatically.




 If connected:




```

Ollama Connected




Models available:




Qwen3:8b

Llama3.1:8b

Mistral:7b




[ Start chatting ]

```




 If disconnected:




```

Welcome to LocalAI




Connect to your local Ollama installation

to start chatting with your models.




[ Retry connection ]

```




---




 # CHAT WORKFLOW




 The ideal workflow:




 ## Step 1




 User opens application.




 ## Step 2




 Application checks Ollama.




 ## Step 3




 Application retrieves installed models.




 ## Step 4




 User selects a model.




 Example:




```

Qwen3:8b

```




 ## Step 5




 User starts a new chat.




 ## Step 6




 User enters:




```

Explain React Server Components.

```




 ## Step 7




 Ollama streams the answer.




 ## Step 8




 User can:




 - Copy

- Regenerate

- Edit

- Continue




 ## Step 9




 User switches model.




 Example:




```

Qwen3:8b

↓

Llama3.1:8b

```




 ## Step 10




 Conversation remains intact.




 ## Step 11




 Next request uses the new model.




 ## Step 12




 Conversation is persisted locally.




---




 # MODEL COMPARISON EXPERIENCE




 Design the architecture so the user can naturally experiment with multiple local models.




 For example:




```

Conversation:




Qwen3:8b

Response...




Llama3.1:8b

Response...




Mistral:7b

Response...

```




 The application should make it obvious which model generated which response.




 This is one of the primary reasons users would want this application.




---




 # SMART MODEL UX




 When changing models, show a subtle confirmation or state change if useful.




 Example:




```

✓ Switched to Llama3.1:8b

```




 Do not interrupt the user with unnecessary modal dialogs.




---




 # MODEL SEARCH




 If the user has many models, model search should be instant.




 Example:




```

Search: qwen




✓ qwen3:8b

  qwen3:14b

  qwen2.5:7b

```




---




 # CONNECTION RETRY




 Provide retry controls wherever useful.




 When the connection comes back:




 - Refresh models

- Update status

- Allow chat again

- Notify user subtly




---




 # LOCAL STORAGE SETTINGS




 Store preferences such as:




 - Theme

- Default model

- Sidebar state

- Enter-to-send preference

- Ollama URL




 Do not unnecessarily persist transient state.




---




 # SECURITY / INPUT HANDLING




 Treat model output as untrusted content.




 Render Markdown safely.




 Do not execute generated HTML or scripts.




 Do not allow model responses to inject arbitrary DOM.




---




 # NO FAKE BACKEND




 Do not create a fake backend simply to demonstrate functionality.




 The application should be designed around the real local Ollama API.




 If a local proxy becomes necessary because of browser/CORS limitations, isolate that concern behind the Ollama service abstraction.




 Do not rewrite the frontend architecture.




---




 # LOCALHOST / DEPLOYMENT CONSIDERATION




 The React development server may run at:




```

http://localhost:5173

```




 while Ollama runs at:




```

http://localhost:11434

```




 Keep this separation in mind.




 The Ollama URL must be configurable.




 If direct browser communication has CORS restrictions in a particular environment, structure the project so a small local proxy/backend can be introduced later.




 Do not pretend a deployed remote website can universally access the user's local Ollama service without considering browser security and networking constraints.




---




 # CODE QUALITY




 Write production-quality code.




 Avoid:




 - Giant components

- Duplicate logic

- Hard-coded models

- Hard-coded fake conversations

- Random global state

- Unnecessary `any`

- Scattered API calls

- Inline business logic everywhere

- Unmaintainable abstractions




 Prefer:




 - Small components

- Reusable components

- Clear types

- Feature-based architecture

- Clean API services

- Custom hooks

- Predictable state




---




 # DESIGN REVIEW




 Before considering the application complete, review it as:




 ### A product designer




 Ask:




 - Is the purpose obvious?

- Is starting a conversation obvious?

- Is model switching obvious?

- Is history easy to navigate?

- Are errors understandable?




 ### A UI designer




 Ask:




 - Is spacing consistent?

- Is typography excellent?

- Are colors cohesive?

- Are borders subtle?

- Are states consistent?

- Does dark mode look premium?




 ### A React engineer




 Ask:




 - Are components maintainable?

- Is state clean?

- Is Ollama isolated behind an API layer?

- Is streaming implemented properly?

- Are errors handled?




 ### An accessibility expert




 Ask:




 - Can keyboard users operate everything?

- Are dialogs accessible?

- Is the model picker accessible?

- Are focus states visible?




 ### A performance engineer




 Ask:




 - Does streaming remain smooth?

- Are large conversations usable?

- Are unnecessary renders avoided?




 Fix problems you find.




---




 # DO NOT BUILD A PROTOTYPE




 This is extremely important.




 Do not stop after creating:




 - Sidebar

- Header

- Chat bubbles

- Input




 The application must feel like a complete product.




 Implement the complete experience.




---




 # REQUIRED FEATURES CHECKLIST




 The finished application must include:




 - [ ] Vite

- [ ] React

- [ ] TypeScript

- [ ] Tailwind CSS

- [ ] Premium responsive UI

- [ ] Dark theme

- [ ] Light theme

- [ ] Ollama connection

- [ ] Ollama connection status

- [ ] Configurable Ollama URL

- [ ] Dynamic model discovery

- [ ] Model search

- [ ] Model selector

- [ ] Model switching

- [ ] Model per conversation

- [ ] Model indicator on responses

- [ ] Model unavailable handling

- [ ] Refresh models

- [ ] New chat

- [ ] Conversation history

- [ ] Pinned conversations

- [ ] Search

- [ ] Rename

- [ ] Archive

- [ ] Duplicate

- [ ] Delete

- [ ] Local persistence

- [ ] Streaming responses

- [ ] Stop generation

- [ ] Markdown rendering

- [ ] Syntax highlighting

- [ ] Code copying

- [ ] Message copying

- [ ] Message editing

- [ ] Regenerate

- [ ] Smart scrolling

- [ ] Jump to latest

- [ ] Settings

- [ ] System prompt

- [ ] Supported model parameters

- [ ] Export

- [ ] Import

- [ ] Keyboard shortcuts

- [ ] Toast notifications

- [ ] Loading states

- [ ] Empty states

- [ ] Error states

- [ ] Mobile drawer

- [ ] Accessibility

- [ ] Strong TypeScript architecture




---




 # FINAL PRODUCT STANDARD




 The final product should feel like:




 A professional local AI operating environment.




 Not:




 A simple chat page.




 The experience should communicate:




 - Local

- Private

- Fast

- Powerful

- Technical

- Premium

- Simple




 Every interaction should feel intentional.




 Every component should have a reason to exist.




 Every state should be designed.




 Every important action should be discoverable.




---




 # FINAL INSTRUCTION TO LOVABLE




 Build this application end-to-end.




 Do not merely create a visual mockup.




 Do not use fake model data where real Ollama data can be retrieved.




 Do not use fake AI responses.




 Do not hide model switching in Settings.




 Dynamic Ollama model discovery and direct model switching are core product requirements.




 The user must be able to open the model selector from the chat interface, see the models actually installed on their computer, select a model, and continue the current conversation using that model.




 Preserve conversation history when switching models.