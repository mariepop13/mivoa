export interface ModelPricing {
  prompt: string;
  completion: string;
  request: string;
  image: string;
}

export interface ModelArchitecture {
  modality: string;
  input_modalities: string[];
  output_modalities: string[];
  tokenizer: string;
  instruct_type: string;
}

export interface TopProvider {
  is_moderated: boolean;
  context_length: number | null;
  max_completion_tokens: number | null;
}

export interface OpenRouterModel {
  id: string;
  canonical_slug: string;
  name: string;
  created: number;
  pricing: ModelPricing;
  context_length: number | null;
  architecture: ModelArchitecture;
  top_provider: TopProvider;
  per_request_limits: {
    prompt_tokens?: number;
    completion_tokens?: number;
  } | null;
  supported_parameters: string[];
  default_parameters: {
    temperature?: number | null;
    top_p?: number | null;
    frequency_penalty?: number | null;
  } | null;
  description: string;
}

export interface ModelsResponse {
  data: OpenRouterModel[];
}

