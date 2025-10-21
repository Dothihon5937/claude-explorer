/**
 * Model selection and configuration
 */

export enum ModelType {
  SONNET_4_5 = 'claude-sonnet-4-5-20250514',
  HAIKU_4_5 = 'claude-haiku-4-5-20250514',
}

export interface ModelConfig {
  name: ModelType;
  maxTokens: number;
  description: string;
  costPerMillionInputTokens: number;
  costPerMillionOutputTokens: number;
}

export const MODELS: Record<ModelType, ModelConfig> = {
  [ModelType.SONNET_4_5]: {
    name: ModelType.SONNET_4_5,
    maxTokens: 8192,
    description: 'Most capable model for complex reasoning and analysis',
    costPerMillionInputTokens: 3.0,
    costPerMillionOutputTokens: 15.0,
  },
  [ModelType.HAIKU_4_5]: {
    name: ModelType.HAIKU_4_5,
    maxTokens: 8192,
    description: 'Fast and efficient for simple tasks',
    costPerMillionInputTokens: 0.8,
    costPerMillionOutputTokens: 4.0,
  },
};

export interface TaskComplexity {
  model: ModelType;
  reasoning: string;
}

/**
 * Select appropriate model based on task complexity
 */
export class ModelSelector {
  /**
   * Determine model based on task type
   */
  selectModel(task: {
    type: 'search' | 'details' | 'export' | 'analyze' | 'chat';
    complexity?: 'simple' | 'moderate' | 'complex';
    requiresReasoning?: boolean;
    multiStep?: boolean;
  }): TaskComplexity {
    // Use Sonnet 4.5 for complex reasoning
    if (
      task.complexity === 'complex' ||
      task.requiresReasoning ||
      task.multiStep ||
      task.type === 'analyze' ||
      task.type === 'chat'
    ) {
      return {
        model: ModelType.SONNET_4_5,
        reasoning: 'Complex task requiring advanced reasoning and tool orchestration',
      };
    }

    // Use Haiku 4.5 for simple, fast operations
    if (
      task.type === 'search' ||
      task.type === 'details' ||
      (task.type === 'export' && !task.multiStep)
    ) {
      return {
        model: ModelType.HAIKU_4_5,
        reasoning: 'Simple task that can be handled efficiently by Haiku',
      };
    }

    // Default to Sonnet for chat and uncertain cases
    return {
      model: ModelType.SONNET_4_5,
      reasoning: 'Using Sonnet for optimal user experience',
    };
  }

  /**
   * Estimate cost for a task
   */
  estimateCost(
    model: ModelType,
    inputTokens: number,
    outputTokens: number
  ): number {
    const config = MODELS[model];
    const inputCost =
      (inputTokens / 1_000_000) * config.costPerMillionInputTokens;
    const outputCost =
      (outputTokens / 1_000_000) * config.costPerMillionOutputTokens;
    return inputCost + outputCost;
  }

  /**
   * Get model info
   */
  getModelInfo(model: ModelType): ModelConfig {
    return MODELS[model];
  }

  /**
   * Compare models
   */
  compareModels(): {
    model: string;
    description: string;
    speed: string;
    cost: string;
    bestFor: string;
  }[] {
    return [
      {
        model: 'Sonnet 4.5',
        description: 'Most capable, best reasoning',
        speed: 'Moderate',
        cost: '$3-15 per million tokens',
        bestFor: 'Complex queries, multi-step tasks, analysis',
      },
      {
        model: 'Haiku 4.5',
        description: 'Fast and efficient',
        speed: 'Fast',
        cost: '$0.8-4 per million tokens',
        bestFor: 'Simple searches, quick exports, listings',
      },
    ];
  }
}

/**
 * Singleton instance
 */
let selectorInstance: ModelSelector | null = null;

export function getModelSelector(): ModelSelector {
  if (!selectorInstance) {
    selectorInstance = new ModelSelector();
  }
  return selectorInstance;
}
