import { Component, createSignal, For, JSX, Show } from 'solid-js'
import RangeInput from './RangeInput'
import TextInput from './TextInput'
import Select, { Option } from './Select'
import { AppSchema } from '../../srv/db/schema'
import { defaultPresets } from '../../common/presets'
import { OPENAI_MODELS, CLAUDE_MODELS } from '../../common/adapters'
import Divider from './Divider'
import { Toggle } from './Toggle'
import Tabs from './Tabs'
import { Check, X } from 'lucide-solid'

type Props = {
  inherit?: Partial<AppSchema.GenSettings>
  disabled?: boolean
  showAll?: boolean
}

const GenerationSettings: Component<Props> = (props) => {
  const tabs = ['General', 'Prompt'] as const
  const [tab, setTab] = createSignal(0)

  return (
    <>
      <Show when={!props.showAll}>
        <Tabs tabs={tabs} select={setTab} selected={tab} />
      </Show>
      <Divider />
      <div class="flex flex-col gap-4">
        <Section show={props.showAll || tabs[tab()] === 'General'}>
          <GeneralSettings disabled={props.disabled} inherit={props.inherit} />
        </Section>

        <Section show={props.showAll || tabs[tab()] === 'Prompt'}>
          <PromptSettings disabled={props.disabled} inherit={props.inherit} />
        </Section>

        <Section show={props.showAll || tabs[tab()] === 'General'}>
          <GenSettings disabled={props.disabled} inherit={props.inherit} />
        </Section>
      </div>
    </>
  )
}
export default GenerationSettings

type SectProps = { show: boolean; children: any }

const Section: Component<SectProps> = (props) => (
  <div class={`flex-col gap-4 ${props.show ? 'flex' : 'hidden'}`}>{props.children}</div>
)

export function CreateTooltip(adapters: string[]): JSX.Element {
  const allAdapaters = ['kobold', 'novel', 'chai', 'ooba', 'horde', 'luminai', 'openai', 'scale']
  return (
    <div>
      <For each={allAdapaters}>
        {(adapter) => (
          <div class="flex flex-row gap-2">
            <Show when={adapters.includes(adapter)}>
              <div class="text-green-500">
                <Check />
              </div>
            </Show>
            <Show when={!adapters.includes(adapter)}>
              <div class="text-red-500">
                <X />
              </div>
            </Show>
            {adapter}
          </div>
        )}
      </For>
    </div>
  )
}

const GeneralSettings: Component<Props> = (props) => {
  return (
    <>
      <div class="text-xl font-bold">General Settings</div>
      <p class="text-sm text-[var(--text-700)]">These are used for all adapters.</p>
      <RangeInput
        fieldName="maxTokens"
        label="Max New Tokens"
        helperText="Number of tokens the AI should generate. Higher numbers will take longer to generate."
        min={16}
        max={512}
        step={1}
        value={props.inherit?.maxTokens || defaultPresets.basic.maxTokens}
        disabled={props.disabled}
      />

      <RangeInput
        fieldName="maxContextLength"
        label="Max Context Length"
        helperText={
          <>
            <p>
              Maximum context length. Typically 2048 for most models. OpenAI supports up to 4K.
              Scale and Claude support up to 8K. If you set this too high, you may get unexpected
              results or errors.
            </p>
            <p>
              We don't have GPT-4 or Claude tokenizers to correctly count tokens for those services.
              Therefore we can't precisely count tokens when generating a prompt. Keep this well
              below 8K to ensure you don't exceed the limit.
            </p>
          </>
        }
        min={16}
        max={8000}
        step={4}
        value={props.inherit?.maxContextLength || defaultPresets.basic.maxContextLength}
        disabled={props.disabled}
      />
      <Select
        fieldName="oaiModel"
        label="OpenAI Model"
        items={modelsToItems(OPENAI_MODELS)}
        helperText="Which OpenAI model to use"
        value={props.inherit?.oaiModel ?? defaultPresets.basic.oaiModel}
        disabled={props.disabled}
      />
      <Select
        fieldName="claudeModel"
        label="Claude Model"
        items={modelsToItems(CLAUDE_MODELS)}
        helperText="Which Claude model to use"
        value={props.inherit?.claudeModel ?? defaultPresets.claude.claudeModel}
        disabled={props.disabled}
      />
    </>
  )
}

const modelsToItems = (models: Record<string, string>): Option<string>[] =>
  Object.entries(models).map(([label, value]) => ({ label, value }))

const PromptSettings: Component<Props> = (props) => {
  return (
    <>
      <div class="text-xl font-bold">Prompt Settings</div>
      <p class="text-sm text-[var(--text-700)]">These are used for all adapters.</p>
      <RangeInput
        fieldName="memoryContextLimit"
        label="Memory: Context Limit"
        helperText="The maximum context length (in tokens) for the memory prompt."
        min={1}
        // No idea what the max should be
        max={2000}
        step={1}
        value={props.inherit?.memoryContextLimit || defaultPresets.basic.memoryContextLimit}
        disabled={props.disabled}
      />

      <RangeInput
        fieldName="memoryDepth"
        label="Memory: Chat History Depth"
        helperText="How far back in the chat history to look for keywords."
        min={1}
        max={100}
        step={1}
        value={props.inherit?.memoryDepth || defaultPresets.basic.memoryDepth}
        disabled={props.disabled}
      />

      <Toggle
        fieldName="useGaslight"
        label="Use Gaslight"
        helperText={
          <>
            <p class="font-bold">
              CAUTION: By using the gaslight, you assume full control of the prompt "pre-amble". If
              you do not include the placeholders, they will not be included in the prompt at all.
            </p>
            If this option is enabled, the Gaslight text will be included in the prompt sent to the
            AI service. Particularly useful for Scale.
          </>
        }
        value={props.inherit?.useGaslight ?? false}
        disabled={props.disabled}
      />

      <TextInput
        fieldName="gaslight"
        label="Gaslight Prompt (OpenAI, Scale, Alpaca, LLaMa, Claude)"
        helperText={
          <>
            How the character definitions are sent to OpenAI. Placeholders:{' '}
            <code>{'{{char}}'}</code> <code>{'{{user}}'}</code> <code>{'{{personality}}'}</code>{' '}
            <code>{'{{memory}}'}</code> <code>{'{{scenario}}'}</code>{' '}
            <code>{'{{example_dialogue}}'}</code>. Any placeholders not present in the gaslight will
            not be sent to the model. Lines with placeholders present in the gaslight but not in the
            character will be removed, for example if a character has no example dialogue the line
            in the gaslight containing <code>{'{{example_dialogue}}'}</code> will be removed before
            being sent to the model.
          </>
        }
        placeholder="Be sure to include the placeholders above"
        isMultiline
        value={props.inherit?.gaslight ?? defaultPresets.openai.gaslight}
        disabled={props.disabled}
      />

      <Divider />
      <div class="text-2xl"> OpenAI Specific</div>

      <Toggle
        fieldName="antiBond"
        label="Anti-Bond"
        helperText={
          <>
            If this option is enabled, OpenAI will be prompted with logit biases to discourage the
            model from talking about "bonding." This is mostly a problem with GPT-4, but can could
            also be used with other OpenAI models.
          </>
        }
        value={props.inherit?.antiBond ?? false}
        disabled={props.disabled}
      />

      <TextInput
        fieldName="ultimeJailbreak"
        label="UJB Prompt (GPT-4 / Turbo / Claude)"
        helperText={
          <>
            (Leave empty to disable)
            <br /> Ultimate Jailbreak. If this option is enabled, the UJB prompt will sent as a
            system message at the end of the conversation before prompting OpenAI or Claude.
          </>
        }
        placeholder="E.g. Keep OOC out of your reply."
        isMultiline
        value={props.inherit?.ultimeJailbreak ?? ''}
        disabled={props.disabled}
      />
    </>
  )
}

const GenSettings: Component<Props> = (props) => {
  return (
    <>
      <div class="text-xl font-bold">Generation Settings</div>
      <RangeInput
        fieldName="temp"
        label="Temperature"
        helperText="Randomness of sampling. High values can increase creativity but may make text less sensible. Lower values will make text more predictable but can become repetitious."
        min={0.1}
        max={20}
        step={0.01}
        value={props.inherit?.temp || defaultPresets.basic.temp}
        disabled={props.disabled}
        adapters={['kobold', 'novel', 'chai', 'ooba', 'horde', 'luminai', 'openai']}
      />

      <RangeInput
        fieldName="topP"
        label="Top P"
        helperText="Used to discard unlikely text in the sampling process. Lower values will make text more predictable but can become repetitious. (Put this value on 1 to disable its effect)"
        min={0}
        max={1}
        step={0.01}
        value={props.inherit?.topP ?? defaultPresets.basic.topP}
        disabled={props.disabled}
        adapters={['kobold', 'novel', 'chai', 'ooba', 'horde', 'luminai']}
      />
      <RangeInput
        fieldName="topK"
        label="Top K"
        helperText="Alternative sampling method, can be combined with top_p. The number of highest probability vocabulary tokens to keep for top-k-filtering. (Put this value on 0 to disable its effect)"
        min={0}
        max={100}
        step={1}
        value={props.inherit?.topK ?? defaultPresets.basic.topK}
        disabled={props.disabled}
        adapters={['kobold', 'novel', 'chai', 'ooba', 'horde', 'luminai']}
      />
      <RangeInput
        fieldName="topA"
        label="Top A"
        helperText="Increases the consistency of the output by removing unlikely tokens based on the highest token probability. (Put this value on 1 to disable its effect)"
        min={0}
        max={1}
        step={0.01}
        value={props.inherit?.topA ?? defaultPresets.basic.topA}
        disabled={props.disabled}
        adapters={['kobold', 'novel', 'horde', 'luminai']}
      />
      <RangeInput
        fieldName="tailFreeSampling"
        label="Tail Free Sampling"
        helperText="Increases the consistency of the output by working from the bottom and trimming the lowest probability tokens. (Put this value on 1 to disable its effect)"
        min={0}
        max={1}
        step={0.001}
        value={props.inherit?.tailFreeSampling ?? defaultPresets.basic.tailFreeSampling}
        disabled={props.disabled}
        adapters={['kobold', 'novel', 'horde', 'luminai']}
      />
      <RangeInput
        fieldName="typicalP"
        label="Typical P"
        helperText="Selects tokens according to the expected amount of information they contribute. Set this setting to 1 to disable its effect."
        min={0}
        max={1}
        step={0.01}
        value={props.inherit?.typicalP ?? defaultPresets.basic.typicalP}
        disabled={props.disabled}
        adapters={['kobold', 'novel', 'chai', 'ooba', 'horde', 'luminai']}
      />
      <RangeInput
        fieldName="repetitionPenalty"
        label="Repetition Penalty"
        helperText="Used to penalize words that were already generated or belong to the context (Going over 1.2 breaks 6B models. Set to 1.0 to disable)."
        min={0}
        max={3}
        step={0.01}
        value={props.inherit?.repetitionPenalty ?? defaultPresets.basic.repetitionPenalty}
        disabled={props.disabled}
        adapters={['kobold', 'novel', 'chai', 'ooba', 'horde', 'luminai']}
      />
      <RangeInput
        fieldName="repetitionPenaltyRange"
        label="Repetition Penalty Range"
        helperText="How many tokens will be considered repeated if they appear in the next output."
        min={0}
        max={2048}
        step={1}
        value={props.inherit?.repetitionPenaltyRange ?? defaultPresets.basic.repetitionPenaltyRange}
        disabled={props.disabled}
        adapters={['kobold', 'novel', 'horde', 'luminai']}
      />
      <RangeInput
        fieldName="repetitionPenaltySlope"
        label="Repetition Penalty Slope"
        helperText="Affects the ramping of the penalty's harshness, starting from the final token. (Set to 0.0 to disable)"
        min={0}
        max={10}
        step={0.01}
        value={props.inherit?.repetitionPenaltySlope ?? defaultPresets.basic.repetitionPenaltySlope}
        disabled={props.disabled}
        adapters={['kobold', 'novel', 'horde', 'luminai']}
      />
      <Divider />
      <div class="text-2xl"> Text-Generation-WebUI Specific</div>
      <Toggle
        fieldName="addBosToken"
        label="Add BOS Token"
        helperText="Add begining of sequence token to the start of prompt. Disabling makes the replies more creative."
        value={props.inherit?.addBosToken ?? false}
        disabled={props.disabled}
      />
      <Toggle
        fieldName="banEosToken"
        label="Ban the end of sequence token. This forces the model to never end the generation prematurely."
        helperText=""
        value={props.inherit?.banEosToken ?? false}
        disabled={props.disabled}
      />
      <RangeInput
        fieldName="encoderRepitionPenalty"
        label="Encoder Repition Penalty"
        helperText="Also known as the 'Hallucinations filter'. Used to penalize tokens that are *not* in the prior text. Higher value = more likely to stay in context, lower value = more likely to diverge."
        min={0.8}
        max={1.5}
        step={0.01}
        value={props.inherit?.encoderRepitionPenalty ?? defaultPresets.basic.encoderRepitionPenalty}
        disabled={props.disabled}
      />
      <RangeInput
        fieldName="penaltyAlpha"
        label="Penalty Alpha"
        helperText="The values balance the model confidence and the degeneration penalty in contrastive search decoding"
        min={0}
        max={5}
        step={0.01}
        value={props.inherit?.penaltyAlpha ?? defaultPresets.basic.penaltyAlpha}
        disabled={props.disabled}
      />
      <Divider />
      <div class="text-2xl"> OpenAI Specific</div>
      <RangeInput
        fieldName="frequencyPenalty"
        label="Frequency Penalty"
        helperText="Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim."
        min={-2.0}
        max={2.0}
        step={0.01}
        value={props.inherit?.frequencyPenalty ?? defaultPresets.openai.frequencyPenalty}
        disabled={props.disabled}
      />
      <RangeInput
        fieldName="presencePenalty"
        label="Presence Penalty"
        helperText="Positive values penalize new tokens based on whether they appear in the text so far, increasing the model's likelihood to talk about new topics."
        min={-2.0}
        max={2.0}
        step={0.01}
        value={props.inherit?.presencePenalty ?? defaultPresets.openai.presencePenalty}
        disabled={props.disabled}
      />
    </>
  )
}
