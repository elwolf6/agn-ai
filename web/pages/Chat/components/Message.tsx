import { Check, Pencil, RefreshCw, ThumbsDown, ThumbsUp, Trash, X, ChevronLeft, ChevronRight } from 'lucide-solid'
import showdown from 'showdown'
import { Component, createMemo, createSignal, For, Show } from 'solid-js'
import { BOT_REPLACE, SELF_REPLACE } from '../../../../common/prompt'
import { AppSchema } from '../../../../srv/db/schema'
import AvatarIcon from '../../../shared/AvatarIcon'
import { chatStore, userStore } from '../../../store'
import { msgStore } from '../../../store/message'

const showdownConverter = new showdown.Converter()

const Message: Component<{
  msg: SplitMessage
  chat: AppSchema.Chat
  char: AppSchema.Character
  last?: boolean
  loading?: boolean
  onRemove: () => void
}> = (props) => {
  const user = userStore()

  const splits = createMemo(
    () => {
      const next = splitMessage(props.char, user.profile!, props.msg)
      return next
    },
    { equals: false }
  )

  return (
    <For each={splits()}>
      {(msg, i) => (
        <SingleMessage
          msg={msg}
          chat={props.chat}
          char={props.char}
          onRemove={props.onRemove}
          last={props.last && i() === splits().length - 1}
          loading={props.loading}
        />
      )}
    </For>
  )
}

const SingleMessage: Component<{
  msg: SplitMessage
  chat: AppSchema.Chat
  char: AppSchema.Character
  last?: boolean
  loading?: boolean
  onRemove: () => void
}> = (props) => {
  const user = userStore()
  const chat = chatStore()
  const members = chat.memberIds

  const [edit, setEdit] = createSignal(false)
  
  const cancelEdit = () => {
    setEdit(false)
  }

  const saveEdit = () => {
    if (!ref) return
    setEdit(false)

    msgStore.editMessage(props.msg._id, ref.innerText)
  }

  const resendMessage = () => {
    msgStore.resend(props.msg.chatId, props.msg._id)
  }

  const retryMessage = () => {
    msgStore.retry(props.msg.chatId)
  }

  const swipeLeft = () => {
    console.log("LEFT");
  }

  const swipeRight = () => {
    console.log("RIGHT");
  }

  const startEdit = () => {
    if (ref) {
      ref.innerText = props.msg.msg
    }

    setEdit(true)
    ref?.focus()
  }

  let ref: HTMLDivElement | undefined

  return (
    <div
      class="flex w-full gap-2 rounded-l-md hover:bg-[var(--bg-800)]"
      data-sender={props.msg.characterId ? 'bot' : 'user'}
      data-bot={props.msg.characterId ? props.char?.name : ''}
      data-user={props.msg.userId ? members[props.msg.userId]?.handle : ''}
    >
      <div class="flex w-12 items-center justify-center">
        <Show when={props.char && !!props.msg.characterId}>
          <AvatarIcon avatarUrl={props.char?.avatar} bot />
        </Show>
        <Show when={!props.msg.characterId}>
          <AvatarIcon avatarUrl={members[props.msg.userId!]?.avatar} />
        </Show>
      </div>
      <div class="flex w-full select-text flex-col">
        <div class="flex w-full flex-row justify-between">
          <div class="flex flex-row">
              <b class="mr-2 ml-7 text-white">
                {props.msg.characterId ? props.char?.name! : members[props.msg.userId!]?.handle}
              </b>
            <span class="text-sm text-white/25">
              {new Intl.DateTimeFormat('en-US', {
                dateStyle: 'short',
                timeStyle: 'short',
              }).format(new Date(props.msg.createdAt))}
            </span>
          </div>
          <Show when={!edit() && user.user?._id === props.chat?.userId}>
            <div class="mr-8 flex items-center gap-2 text-sm">
              <Show when={props.last && props.msg.characterId}>
                <RefreshCw
                  size={18}
                  class="cursor-pointer text-white/20 hover:text-white"
                  onClick={retryMessage}
                />
              </Show>
              <Show when={props.last && !props.msg.characterId}>
                <RefreshCw size={18} class="cursor-pointer" onClick={resendMessage} />
              </Show>
              <Show when={!props.msg.split}>
                <Pencil
                  size={18}
                  class="cursor-pointer text-white/20 hover:text-white"
                  onClick={startEdit}
                />
                <Trash
                  size={18}
                  class="cursor-pointer text-white/20 hover:text-white"
                  onClick={props.onRemove}
                />
              </Show>
            </div>
          </Show>
          <Show when={edit()}>
            <div class="mr-6 cursor-pointer text-white/20 hover:text-white flex gap-4">
              <X size={18} class="cursor-pointer text-red-500" onClick={cancelEdit} />
              <Check size={18} class="cursor-pointer text-green-500" onClick={saveEdit} />
            </div>
          </Show>
        </div>
        <div class="break-words opacity-50 flex flex-row">
          <Show when={!props.loading && props.last && !edit() && document.getElementsByClassName('dot-flashing').length === 0}>
            <div class="opacity-100 my-auto cursor-pointer">
              <ChevronLeft 
                size={28}
                onClick={swipeLeft}
              />
            </div>
          </Show>
          <Show when={!props.last || (props.last && edit()) || document.getElementsByClassName('dot-flashing').length !== 0}>
            <div class="ml-7">
            </div>
          </Show>
          <Show when={!edit()}>
            <div
              innerHTML={showdownConverter.makeHtml(
                parseMessage(props.msg.msg, props.char!, user.profile!)
              )}
            />
          </Show>
          <Show when={!edit() && props.loading}>
            <div class="flex pl-4 py-2">
              <div class="dot-flashing bg-[var(--hl-700)]"></div>
            </div>
          </Show>
          <Show when={edit()}>
            <div ref={ref} contentEditable={true}>
              {props.msg.msg}
            </div>
          </Show>
          <Show when={!props.loading && props.last && !edit() && document.getElementsByClassName('dot-flashing').length === 0}>
            <div class="opacity-100 ml-auto mr-6 my-auto cursor-pointer">
              <ChevronRight
                size={28}
                onClick={swipeRight}
              />
            </div>
          </Show>
        </div>
          {/* <Show when={props.msg.characterId && user.user?._id === props.chat?.userId && false}> */}
          <Show when={props.msg.characterId}>
              <div class="ml-7 flex flex-row items-center py-2 text-white/20 gap-2">
                <ThumbsUp size={18} class="cursor-pointer hover:text-white" />
                <ThumbsDown size={18} class="cursor-pointer hover:text-white" />
              </div>
          </Show>
      </div>
    </div>
  )
}

export default Message

function parseMessage(msg: string, char: AppSchema.Character, profile: AppSchema.Profile) {
  return msg.replace(BOT_REPLACE, char.name).replace(SELF_REPLACE, profile?.handle || 'You')
}

export type SplitMessage = AppSchema.ChatMessage & { split?: boolean }

function splitMessage(
  char: AppSchema.Character,
  profile: AppSchema.Profile,
  msg: AppSchema.ChatMessage
): SplitMessage[] {
  const CHARS = [`${char.name}:`, `{{char}}:`]
  const USERS = [`${profile.handle || 'You'}:`, `{{user}}:`]

  const next: AppSchema.ChatMessage[] = []

  const splits = msg.msg.split('\n')
  if (splits.length === 1) {
    next.push(msg)
  }

  for (const split of splits) {
    const trim = split.trim()
    let newMsg: AppSchema.ChatMessage | undefined

    for (const CHAR of CHARS) {
      if (newMsg) break
      if (trim.startsWith(CHAR)) {
        newMsg = { ...msg, msg: trim.replace(CHAR, ''), characterId: char._id, userId: undefined }
        break
      }
    }

    for (const USER of USERS) {
      if (newMsg) break
      if (trim.startsWith(USER)) {
        newMsg = {
          ...msg,
          msg: trim.replace(USER, ''),
          userId: profile.userId,
          characterId: undefined,
        }
        break
      }
    }

    if (!next.length && !newMsg) return [msg]

    if (!newMsg) {
      const lastMsg = next.slice(-1)[0]
      lastMsg.msg += ` ${trim}`
      continue
    }

    next.push(newMsg)
    continue
  }

  if (!next.length || next.length === 1) return [msg]
  const newSplits = next.map((next) => ({ ...next, split: true }))
  return newSplits
}
