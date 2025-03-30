import { z } from 'zod';
import { formatBytes } from './utils';

// ----- Common API Models ----- //
export enum ChatRole {
  USER = 'user',
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
}
const ChatRoleSchema = z.nativeEnum(ChatRole);

// ----- Ollama API Models ----- //
const OllamaModelSchema = z
  .object({
    name: z.string(),
    model: z.string(),
    modified_at: z.string(),
    size: z.number(),
    digest: z.string(),
    details: z.object({
      parent_model: z.string(),
      format: z.string(),
      family: z.string(),
      families: z.nullable(z.array(z.string())),
      parameter_size: z.string(),
      quantization_level: z.string(),
    }),
  })
  .transform((values) => ({
    ...values,
    get sizeInGB() {
      return formatBytes(values.size);
    },
  }));

export const OllamaTagSchema = z.object({
  models: z.array(OllamaModelSchema),
});

export type OllamaModel = z.infer<typeof OllamaModelSchema>;
export type OllamaTag = z.infer<typeof OllamaTagSchema>;

// ----- OpenAI API Models ----- //
const UsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
});

const MessageSchema = z.object({
  role: ChatRoleSchema.default(ChatRole.ASSISTANT),
  content: z.string(),
});

const ChoiceSchema = z.object({
  index: z.number(),
  delta: MessageSchema,
  finish_reason: z.string().or(z.nullable(z.string())),
});

const ChatCompletionSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  system_fingerprint: z.string(),
  choices: z.array(ChoiceSchema),
  usage: UsageSchema.or(z.nullable(UsageSchema)),
});

const ChatCompletionRequestSchema = z.object({
  model: z.string(),
  messages: z.array(MessageSchema),
  stream: z.boolean(),
});

const AnthropicModelResponseSchema = z.object({
  type: z.string(),
  id: z.string(),
  display_name: z.string(),
  created_at: z.string(),
});

const OpenAIModelResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  type: z.string().nullable().optional(),
});

const ModelSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  type: z.string().nullable().optional(),
  embedding: z.boolean().nullable(),
});

export const CreateImageRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required!'),
  model: z.string(),
  n: z.number().default(1),
  quality: z.string().default('standard'),
  size: z.string().default('1024x1024'),
  style: z.string().default('vivid'),
  user: z.string().optional(),
});

const CreateImageDataSchema = z.object({
  url: z.string(),
  b64_json: z.string().optional(),
  revised_prompt: z.string(),
});

const CreateImageResponseSchema = z.object({
  created: z.number(),
  data: z.array(CreateImageDataSchema),
});

export type TCreateImageResponse = z.infer<typeof CreateImageResponseSchema>;
export type TCreateImageRequest = z.infer<typeof CreateImageRequestSchema>;
export type TCreateImageData = z.infer<typeof CreateImageDataSchema>;

export const OpenAIModelsResponseSchema = z.array(OpenAIModelResponseSchema);
export const AnthropicModelsResponseSchema = z.array(AnthropicModelResponseSchema);

export type TChatMessage = z.infer<typeof MessageSchema>;
export type TChatCompletionResponse = z.infer<typeof ChatCompletionSchema>;
export type TChatCompletionRequest = z.infer<typeof ChatCompletionRequestSchema>;
export type TModelsResponseSchema = z.infer<typeof OpenAIModelsResponseSchema>;
export type TOpenAIModelResponseSchema = z.infer<typeof OpenAIModelResponseSchema>;
export type TAnthropicModelResponseSchema = z.infer<typeof AnthropicModelResponseSchema>;

export type TModelSchema = z.infer<typeof ModelSchema>;

export type TMessage = TChatMessage | TCreateImageData;

// ----- Custom Models ----- //
export const EmbedDocumentResponseSchema = z.object({
  success: z.boolean(),
  errorMessage: z.string().nullable(),
});

export type TEmbedDocumentResponse = z.infer<typeof EmbedDocumentResponseSchema>;

const urlPattern = /^(https?:\/\/)(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?(\/.*)?$/;

const ApiSettingsSchema = z.object({
  serviceId: z.string().readonly(),
  hasEmbedding: z.boolean().readonly(),
  embeddingPath: z.string().readonly(),
  lockedModelType: z.boolean().readonly(),
  url: z.string().regex(urlPattern, "URL must start with 'http://' or 'https://' followed by a domain name."), //  without any trailing path.
  modelListType: z.string({ required_error: 'Please select a model api.' }).min(2, 'Please select a model api.'),
  apiKey: z.union([z.string().min(5, 'API Key must be at least 5 characters long.'), z.literal('')]).optional(),
});

export type TApiSettingsSchema = z.infer<typeof ApiSettingsSchema>;

export const SettingsFormSchema = z.object({
  services: z.array(ApiSettingsSchema),
});

export type TSettingsFormSchema = z.infer<typeof SettingsFormSchema>;

export type OpenPopovers = {
  [key: string]: boolean;
};

export type CompletionsRequest = {
  model: string;
  messages: TChatMessage[];
  // abortSignal: AbortSignal;
  apiKey: string;
  baseUrl: string;
};
