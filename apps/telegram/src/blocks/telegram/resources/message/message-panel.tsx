import type { UseWorkflowApi } from '@auxx/sdk/client'
import type { telegramSchema } from '../../telegram-schema'
import { CHAT_ACTION_OPTIONS, PARSE_MODE_OPTIONS } from './message-schema'

interface MessagePanelProps {
  api: UseWorkflowApi<typeof telegramSchema>
}

export function MessagePanel({ api }: MessagePanelProps) {
  const {
    StringInput,
    NumberInput,
    BooleanInput,
    OptionsInput,
    VarField,
    VarFieldGroup,
    Section,
    ConditionalRender,
  } = api

  return (
    <>
      {/* Send Message */}
      <ConditionalRender when={(d) => d.operation === 'sendMessage'}>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendMessageChatId" />
            </VarField>
            <VarField>
              <StringInput name="sendMessageText" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="sendMessageParseMode" options={PARSE_MODE_OPTIONS} />
            </VarField>
            <VarField>
              <BooleanInput name="sendMessageDisablePreview" />
            </VarField>
            <VarField>
              <BooleanInput name="sendMessageDisableNotification" />
            </VarField>
            <VarField>
              <StringInput name="sendMessageReplyToMessageId" />
            </VarField>
            <VarField>
              <StringInput name="sendMessageThreadId" />
            </VarField>
            <VarField>
              <StringInput name="sendMessageReplyMarkup" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Edit Text */}
      <ConditionalRender when={(d) => d.operation === 'editMessageText'}>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="editTextMessageType" />
            </VarField>
            <ConditionalRender when={(d) => d.editTextMessageType !== 'inlineMessage'}>
              <VarField>
                <StringInput name="editTextChatId" />
              </VarField>
              <VarField>
                <StringInput name="editTextMessageId" />
              </VarField>
            </ConditionalRender>
            <ConditionalRender when={(d) => d.editTextMessageType === 'inlineMessage'}>
              <VarField>
                <StringInput name="editTextInlineMessageId" />
              </VarField>
            </ConditionalRender>
            <VarField>
              <StringInput name="editTextText" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="editTextParseMode" options={PARSE_MODE_OPTIONS} />
            </VarField>
            <VarField>
              <BooleanInput name="editTextDisablePreview" />
            </VarField>
            <VarField>
              <StringInput name="editTextReplyMarkup" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Delete */}
      <ConditionalRender when={(d) => d.operation === 'deleteMessage'}>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <StringInput name="deleteChatId" />
            </VarField>
            <VarField>
              <StringInput name="deleteMessageId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Pin */}
      <ConditionalRender when={(d) => d.operation === 'pinMessage'}>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <StringInput name="pinChatId" />
            </VarField>
            <VarField>
              <StringInput name="pinMessageId" />
            </VarField>
            <VarField>
              <BooleanInput name="pinDisableNotification" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Unpin */}
      <ConditionalRender when={(d) => d.operation === 'unpinMessage'}>
        <Section title="Message">
          <VarFieldGroup>
            <VarField>
              <StringInput name="unpinChatId" />
            </VarField>
            <VarField>
              <StringInput name="unpinMessageId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Send Chat Action */}
      <ConditionalRender when={(d) => d.operation === 'sendChatAction'}>
        <Section title="Action">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendActionChatId" />
            </VarField>
            <VarField>
              <OptionsInput name="sendActionAction" options={CHAT_ACTION_OPTIONS} />
            </VarField>
            <VarField>
              <StringInput name="sendActionThreadId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Send Photo */}
      <ConditionalRender when={(d) => d.operation === 'sendPhoto'}>
        <Section title="Media">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendPhotoChatId" />
            </VarField>
            <VarField>
              <StringInput name="sendPhotoFile" />
            </VarField>
            <VarField>
              <StringInput name="sendPhotoCaption" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="sendPhotoParseMode" options={PARSE_MODE_OPTIONS} />
            </VarField>
            <VarField>
              <BooleanInput name="sendPhotoDisableNotification" />
            </VarField>
            <VarField>
              <StringInput name="sendPhotoReplyToMessageId" />
            </VarField>
            <VarField>
              <StringInput name="sendPhotoThreadId" />
            </VarField>
            <VarField>
              <StringInput name="sendPhotoReplyMarkup" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Send Document */}
      <ConditionalRender when={(d) => d.operation === 'sendDocument'}>
        <Section title="Media">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendDocChatId" />
            </VarField>
            <VarField>
              <StringInput name="sendDocFile" />
            </VarField>
            <VarField>
              <StringInput name="sendDocCaption" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="sendDocParseMode" options={PARSE_MODE_OPTIONS} />
            </VarField>
            <VarField>
              <BooleanInput name="sendDocDisableNotification" />
            </VarField>
            <VarField>
              <StringInput name="sendDocReplyToMessageId" />
            </VarField>
            <VarField>
              <StringInput name="sendDocThreadId" />
            </VarField>
            <VarField>
              <StringInput name="sendDocReplyMarkup" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Send Video */}
      <ConditionalRender when={(d) => d.operation === 'sendVideo'}>
        <Section title="Media">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendVideoChatId" />
            </VarField>
            <VarField>
              <StringInput name="sendVideoFile" />
            </VarField>
            <VarField>
              <StringInput name="sendVideoCaption" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="sendVideoParseMode" options={PARSE_MODE_OPTIONS} />
            </VarField>
            <VarField>
              <NumberInput name="sendVideoDuration" />
            </VarField>
            <VarField>
              <NumberInput name="sendVideoWidth" />
            </VarField>
            <VarField>
              <NumberInput name="sendVideoHeight" />
            </VarField>
            <VarField>
              <BooleanInput name="sendVideoDisableNotification" />
            </VarField>
            <VarField>
              <StringInput name="sendVideoReplyToMessageId" />
            </VarField>
            <VarField>
              <StringInput name="sendVideoThreadId" />
            </VarField>
            <VarField>
              <StringInput name="sendVideoReplyMarkup" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Send Audio */}
      <ConditionalRender when={(d) => d.operation === 'sendAudio'}>
        <Section title="Media">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendAudioChatId" />
            </VarField>
            <VarField>
              <StringInput name="sendAudioFile" />
            </VarField>
            <VarField>
              <StringInput name="sendAudioCaption" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="sendAudioParseMode" options={PARSE_MODE_OPTIONS} />
            </VarField>
            <VarField>
              <NumberInput name="sendAudioDuration" />
            </VarField>
            <VarField>
              <StringInput name="sendAudioPerformer" />
            </VarField>
            <VarField>
              <StringInput name="sendAudioTitle" />
            </VarField>
            <VarField>
              <BooleanInput name="sendAudioDisableNotification" />
            </VarField>
            <VarField>
              <StringInput name="sendAudioReplyToMessageId" />
            </VarField>
            <VarField>
              <StringInput name="sendAudioThreadId" />
            </VarField>
            <VarField>
              <StringInput name="sendAudioReplyMarkup" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Send Animation */}
      <ConditionalRender when={(d) => d.operation === 'sendAnimation'}>
        <Section title="Media">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendAnimationChatId" />
            </VarField>
            <VarField>
              <StringInput name="sendAnimationFile" />
            </VarField>
            <VarField>
              <StringInput name="sendAnimationCaption" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <OptionsInput name="sendAnimationParseMode" options={PARSE_MODE_OPTIONS} />
            </VarField>
            <VarField>
              <NumberInput name="sendAnimationDuration" />
            </VarField>
            <VarField>
              <NumberInput name="sendAnimationWidth" />
            </VarField>
            <VarField>
              <NumberInput name="sendAnimationHeight" />
            </VarField>
            <VarField>
              <BooleanInput name="sendAnimationDisableNotification" />
            </VarField>
            <VarField>
              <StringInput name="sendAnimationReplyToMessageId" />
            </VarField>
            <VarField>
              <StringInput name="sendAnimationThreadId" />
            </VarField>
            <VarField>
              <StringInput name="sendAnimationReplyMarkup" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Send Sticker */}
      <ConditionalRender when={(d) => d.operation === 'sendSticker'}>
        <Section title="Media">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendStickerChatId" />
            </VarField>
            <VarField>
              <StringInput name="sendStickerFile" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="sendStickerDisableNotification" />
            </VarField>
            <VarField>
              <StringInput name="sendStickerReplyToMessageId" />
            </VarField>
            <VarField>
              <StringInput name="sendStickerThreadId" />
            </VarField>
            <VarField>
              <StringInput name="sendStickerReplyMarkup" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Send Location */}
      <ConditionalRender when={(d) => d.operation === 'sendLocation'}>
        <Section title="Location">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendLocationChatId" />
            </VarField>
            <VarField>
              <StringInput name="sendLocationLatitude" />
            </VarField>
            <VarField>
              <StringInput name="sendLocationLongitude" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="sendLocationDisableNotification" />
            </VarField>
            <VarField>
              <StringInput name="sendLocationReplyToMessageId" />
            </VarField>
            <VarField>
              <StringInput name="sendLocationThreadId" />
            </VarField>
            <VarField>
              <StringInput name="sendLocationReplyMarkup" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>

      {/* Send Media Group */}
      <ConditionalRender when={(d) => d.operation === 'sendMediaGroup'}>
        <Section title="Media Group">
          <VarFieldGroup>
            <VarField>
              <StringInput name="sendMediaGroupChatId" />
            </VarField>
            <VarField>
              <StringInput name="sendMediaGroupMedia" />
            </VarField>
          </VarFieldGroup>
        </Section>
        <Section title="Options" collapsible>
          <VarFieldGroup>
            <VarField>
              <BooleanInput name="sendMediaGroupDisableNotification" />
            </VarField>
            <VarField>
              <StringInput name="sendMediaGroupReplyToMessageId" />
            </VarField>
            <VarField>
              <StringInput name="sendMediaGroupThreadId" />
            </VarField>
          </VarFieldGroup>
        </Section>
      </ConditionalRender>
    </>
  )
}
