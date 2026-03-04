import { Workflow } from '@auxx/sdk'

export const chatInputs = {
  // --- Get ---
  getChatChatId: Workflow.string({
    label: 'Chat ID',
    placeholder: 'Chat ID or @username',
    acceptsVariables: true,
  }),

  // --- Get Administrators ---
  getAdminsChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),

  // --- Get Member ---
  getMemberChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  getMemberUserId: Workflow.string({
    label: 'User ID',
    acceptsVariables: true,
  }),

  // --- Leave ---
  leaveChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),

  // --- Set Description ---
  setDescChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  setDescDescription: Workflow.string({
    label: 'Description',
    description: '0-255 characters',
    acceptsVariables: true,
  }),

  // --- Set Title ---
  setTitleChatId: Workflow.string({
    label: 'Chat ID',
    acceptsVariables: true,
  }),
  setTitleTitle: Workflow.string({
    label: 'Title',
    description: '1-255 characters',
    acceptsVariables: true,
  }),
}

export function chatComputeOutputs(operation: string) {
  switch (operation) {
    case 'get':
      return {
        chatId: Workflow.string({ label: 'Chat ID' }),
        type: Workflow.string({ label: 'Type' }),
        title: Workflow.string({ label: 'Title' }),
        username: Workflow.string({ label: 'Username' }),
        firstName: Workflow.string({ label: 'First Name' }),
        lastName: Workflow.string({ label: 'Last Name' }),
        description: Workflow.string({ label: 'Description' }),
        memberCount: Workflow.string({ label: 'Member Count' }),
      }
    case 'getAdministrators':
      return {
        administrators: Workflow.array({
          label: 'Administrators',
          items: Workflow.struct({
            status: Workflow.string({ label: 'Status' }),
            userId: Workflow.string({ label: 'User ID' }),
          }),
        }),
        count: Workflow.string({ label: 'Count' }),
      }
    case 'getMember':
      return {
        status: Workflow.string({ label: 'Status' }),
        userId: Workflow.string({ label: 'User ID' }),
        firstName: Workflow.string({ label: 'First Name' }),
        lastName: Workflow.string({ label: 'Last Name' }),
        username: Workflow.string({ label: 'Username' }),
        isBot: Workflow.string({ label: 'Is Bot' }),
      }
    case 'leave':
    case 'setDescription':
    case 'setTitle':
      return {
        success: Workflow.string({ label: 'Success' }),
      }
    default:
      return {}
  }
}
