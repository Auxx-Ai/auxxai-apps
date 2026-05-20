// src/blocks/whatsapp/whatsapp.server.ts

import type { WorkflowExecuteFunction } from '@auxx/sdk'
import { whatsappBlock } from './whatsapp.workflow'

/**
 * Project the block's flat union input shape onto the tool-specific input
 * shape for the dispatched op. The block uses prefixed field names
 * (`sendTextBody`, `uploadMediaUrl`, ...) so that one schema can hold all
 * op variants; each underlying tool takes flat inputs.
 */
function projectInputsForOp(key: string, input: Record<string, any>): Record<string, unknown> {
  switch (key) {
    case 'message.sendText':
      return {
        phoneNumberId: input.phoneNumberId,
        recipientPhone: input.recipientPhone,
        body: input.sendTextBody,
        previewUrl: input.sendTextPreviewUrl ?? false,
      }
    case 'message.sendMedia':
      return {
        phoneNumberId: input.phoneNumberId,
        recipientPhone: input.recipientPhone,
        mediaType: input.sendMediaType ?? 'image',
        mediaUrl: input.sendMediaUrl,
        caption: input.sendMediaCaption,
        filename: input.sendMediaFilename,
      }
    case 'message.sendTemplate':
      return {
        phoneNumberId: input.phoneNumberId,
        recipientPhone: input.recipientPhone,
        templateId: input.sendTemplateId,
        components: input.sendTemplateComponents,
      }
    case 'message.sendContacts':
      return {
        phoneNumberId: input.phoneNumberId,
        recipientPhone: input.recipientPhone,
        formattedName: input.sendContactFormattedName,
        firstName: input.sendContactFirstName,
        lastName: input.sendContactLastName,
        phone: input.sendContactPhone,
        email: input.sendContactEmail,
      }
    case 'message.sendLocation':
      return {
        phoneNumberId: input.phoneNumberId,
        recipientPhone: input.recipientPhone,
        longitude: input.sendLocationLongitude,
        latitude: input.sendLocationLatitude,
        name: input.sendLocationName,
        address: input.sendLocationAddress,
      }
    case 'media.upload':
      return {
        phoneNumberId: input.uploadPhoneNumberId,
        mediaUrl: input.uploadMediaUrl,
      }
    case 'media.getUrl':
      return {
        mediaId: input.getUrlMediaId,
      }
    case 'media.delete':
      return {
        mediaId: input.deleteMediaId,
      }
    default:
      throw new Error(`Unknown op: ${key}`)
  }
}

/**
 * Project the tool's flat output back onto the block's declared output
 * shape for the dispatched op. Only `media.getUrl` needs renaming today
 * (`url` → `mediaUrl`); the rest pass through.
 */
function projectOutputForOp(
  key: string,
  output: Record<string, any>
): Record<string, unknown> {
  if (key === 'media.getUrl') {
    return {
      mediaId: output.mediaId,
      mediaUrl: output.url,
      mimeType: output.mimeType,
      fileSize: output.fileSize,
      sha256: output.sha256,
    }
  }
  return output
}

const execute: WorkflowExecuteFunction<typeof whatsappBlock.schema> = async (
  input: any,
  ctx: any
) => {
  const key = `${input.resource}.${input.operation}`
  const toolId = (whatsappBlock.toolMap as Record<string, string>)[key]
  if (!toolId) {
    throw new Error(`Unknown op: ${key}`)
  }
  const projected = projectInputsForOp(key, input)
  const result = await ctx.runTool(toolId, projected)
  return projectOutputForOp(key, result) as any
}

export default execute
