# Template

> Scaffold for a new Auxx app.

This directory is the starting point for every new Auxx app. Copy it,
rename, and rip out the example tool / block / trigger as you replace
them with the real thing.

## Getting Started

```bash
pnpm install
pnpm run dev      # watch + bundle + hot reload
pnpm run build    # production bundle
pnpm run format
```

## Project Structure

```
template/
├── src/
│   ├── app.tsx                                  # registry: lists tools, blocks, triggers
│   ├── app.settings.ts                          # admin-facing settings schema
│   ├── tools/
│   │   ├── ping.tool.tsx + .server.ts           # agent-exposed tool (has `agent` key)
│   │   ├── echo.tool.tsx + .server.ts           # internal-only tool (no surface keys)
│   │   ├── reverse.tool.tsx + .server.ts        # internal-only tool
│   │   └── toolsets.ts                          # admin-approvable groups of agent tools
│   ├── blocks/template/
│   │   ├── template.workflow.tsx                # block declaration + `toolMap`
│   │   ├── template.server.ts                   # `ctx.runTool` dispatcher
│   │   ├── template-schema.ts
│   │   └── template-panel.tsx
│   ├── triggers/example/
│   │   ├── example.workflow.tsx                 # `defineTrigger({ … workflow: {…} })`
│   │   ├── example.server.ts
│   │   ├── example-schema.ts
│   │   └── example-panel.tsx
│   ├── events/                                  # connection lifecycle hooks
│   ├── webhooks/                                # inbound webhook handlers
│   └── assets/                                  # static assets (icon.png, etc.)
├── package.json
├── tsconfig.json
└── README.md
```

## Surfaces — the unified model

Every tool, block, and trigger lives in `src/app.tsx`'s registry. **Where**
each one shows up is controlled by *surface keys* on the definition itself,
not by which array it lives in.

### Tools

```ts
import { defineTool, z } from '@auxx/sdk/tools'

export const pingTool = defineTool({
  id: 'ping',
  name: 'Ping',
  description: 'Echoes a message back.',
  inputs: z.object({ message: z.string() }),
  outputs: z.object({ reply: z.string() }),
  execute: pingExecute,
  agent: { toolsetSlug: 'template.examples' },
  // action: { label: 'Ping', surface: 'ticket-header', … }   // optional
})
```

| Surface key | Effect |
|---|---|
| `agent: {…}`  | Tool appears in the agent picker (gated by its `toolsetSlug`). |
| `action: {…}` | Tool also runs as a quick action on a ticket / record. |
| *(neither)*   | Internal-only. Tool is callable by the platform (e.g. a block dispatcher) but invisible in pickers. |

Add as many keys as apply — a tool can be agent-exposed, quick-action-exposed,
and a block target all at once.

### Blocks → dispatchers

A workflow block doesn't carry business logic anymore. It declares a
`toolMap` that routes each operation to an internal tool, and its server
file is a thin `ctx.runTool` dispatcher:

```ts
// blocks/template/template.workflow.tsx
export const templateBlock = {
  id: 'template',
  schema: templateSchema,
  node: TemplateNode,
  panel: TemplatePanel,
  toolMap: {
    echo:    'echo',
    reverse: 'reverse',
  },
  execute: templateExecute,
} satisfies WorkflowBlock<typeof templateSchema>

// blocks/template/template.server.ts
const execute: WorkflowExecuteFunction<typeof templateBlock.schema> =
  async (input, ctx) => {
    const toolId = templateBlock.toolMap[String(input.operation)]
    return ctx.runTool(toolId, { text: input.text })
  }
export default execute
```

The internal tools (`echo`, `reverse`) are regular `defineTool` calls
with **no** `agent` / `action` keys — they exist solely to back the
block. Real apps with a `resource × operation` matrix project the
block's union input shape onto each tool's flat input shape before
calling `ctx.runTool`; see `apps/whatsapp/src/blocks/whatsapp/whatsapp.server.ts`.

### Triggers

Triggers are declared with `defineTrigger` and use `workflow` as their
surface key:

```ts
import { defineTrigger } from '@auxx/sdk'

export const exampleTrigger = defineTrigger({
  id: 'template.example',
  schema: exampleTriggerSchema,
  execute: exampleTriggerExecute,
  workflow: {
    node: ExampleTriggerNode,
    panel: ExampleTriggerPanel,
  },
  // agent: {},  // uncomment to fan out into agents
})
```

The same pattern as tools: `workflow` gates visibility in the workflow
trigger picker; `agent` (optional) gates fan-out to agents.

## Connections

`getConnection()` from `@auxx/sdk/server` returns the credential bound to the
invocation. Single-secret and OAuth definitions expose the value directly;
definitions with connection variables (multi-field secret, e.g. client ID +
client secret + account number) expose the merged map on `fields`:

```ts
import { getConnection } from '@auxx/sdk/server'

const connection = getConnection()
const token = connection.value                                   // single secret / OAuth token
const { client_id, client_secret } = connection.fields ?? {}     // multi-field secret
```

## Toolsets

`src/tools/toolsets.ts` groups agent-exposed tools into admin-approvable
bundles. Every tool with an `agent: { toolsetSlug }` should reference an
id declared here.

```ts
export const templateToolsets: Toolset[] = [
  {
    id: 'template.examples',
    name: 'Template examples',
    description: 'Example tools an agent can call.',
    tools: ['ping'],
  },
]
```

## App component

```tsx
export function App() {
  return <TextBlock>…</TextBlock>
}
```

Rendered by the platform on the app's settings page. Keep it short —
explain the integration to the admin who's about to install it.

## Documentation

- [Auxx SDK Documentation](https://docs.auxx.ai)
- [API Reference](https://docs.auxx.ai/api)
- [Examples](https://docs.auxx.ai/examples)

## Support

- [Discord Community](https://discord.gg/auxx)
- [GitHub Issues](https://github.com/auxx-ai/sdk/issues)
- [Email Support](mailto:support@auxx.ai)
