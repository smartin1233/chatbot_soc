import type { BUCreationData, LOBCreationData, BusinessUnit } from './types';

export interface ChatCommand {
  intent: string;
  confidence: number;
  entities: ChatEntity[];
  parameters: Record<string, any>;
  requiresFollowup: boolean;
  nextStep?: string;
}

export interface ChatEntity {
  type: 'bu_name' | 'lob_name' | 'description' | 'code' | 'date' | 'business_unit';
  value: string;
  confidence: number;
}

export interface ConversationState {
  currentIntent?: string;
  collectedData: Partial<BUCreationData | LOBCreationData>;
  missingFields: string[];
  step: number;
  maxSteps: number;
}

export class ChatCommandProcessor {
  private conversationStates = new Map<string, ConversationState>();

  parseCommand(message: string, sessionId: string = 'default'): ChatCommand {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Intent detection patterns
    const intentPatterns = {
      create_bu: [
        /create.*business unit/i,
        /new.*business unit/i,
        /add.*business unit/i,
        /make.*business unit/i,
        /set up.*business unit/i
      ],
      create_lob: [
        /create.*line of business/i,
        /new.*line of business/i,
        /add.*line of business/i,
        /make.*line of business/i,
        /create.*lob/i,
        /new.*lob/i,
        /add.*lob/i
      ],
      upload_data: [
        /upload.*data/i,
        /upload.*file/i,
        /add.*data/i,
        /import.*data/i,
        /load.*data/i,
        /attach.*file/i
      ],
      provide_info: [
        /my.*name is/i,
        /the name is/i,
        /call it/i,
        /description.*is/i,
        /code.*is/i
      ]
    };

    // Check for creation intents
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedMessage)) {
          const entities = this.extractEntities(message);
          const parameters = this.extractParameters(message, intent);
          
          return {
            intent,
            confidence: 0.9,
            entities,
            parameters,
            requiresFollowup: this.requiresFollowup(intent, entities),
            nextStep: this.getNextStep(intent, entities)
          };
        }
      }
    }

    // Check if this is a response to an ongoing conversation
    const conversationState = this.conversationStates.get(sessionId);
    if (conversationState) {
      return this.processConversationResponse(message, sessionId);
    }

    // Default: no command detected
    return {
      intent: 'unknown',
      confidence: 0.1,
      entities: [],
      parameters: {},
      requiresFollowup: false
    };
  }

  startConversation(intent: string, sessionId: string = 'default'): ConversationState {
    const state: ConversationState = {
      currentIntent: intent,
      collectedData: {},
      missingFields: this.getRequiredFields(intent),
      step: 1,
      maxSteps: this.getMaxSteps(intent)
    };

    this.conversationStates.set(sessionId, state);
    return state;
  }

  updateConversation(sessionId: string, field: string, value: any): ConversationState | null {
    const state = this.conversationStates.get(sessionId);
    if (!state) return null;

    // Update collected data
    state.collectedData[field] = value;
    
    // Remove from missing fields
    state.missingFields = state.missingFields.filter(f => f !== field);
    
    // Increment step
    state.step++;

    this.conversationStates.set(sessionId, state);
    return state;
  }

  isConversationComplete(sessionId: string): boolean {
    const state = this.conversationStates.get(sessionId);
    return state ? state.missingFields.length === 0 : false;
  }

  getConversationData(sessionId: string): Partial<BUCreationData | LOBCreationData> | null {
    const state = this.conversationStates.get(sessionId);
    return state ? state.collectedData : null;
  }

  clearConversation(sessionId: string): void {
    this.conversationStates.delete(sessionId);
  }

  getConversationState(sessionId: string): ConversationState | null {
    return this.conversationStates.get(sessionId) || null;
  }

  generateNextQuestion(sessionId: string, availableBusinessUnits?: BusinessUnit[]): string {
    const state = this.conversationStates.get(sessionId);
    if (!state || state.missingFields.length === 0) {
      return "Perfect! I have all the information I need. Let me create that for you now! ✅";
    }

    const nextField = state.missingFields[0];
    const intent = state.currentIntent;
    const collectedName = state.collectedData.name as string;

    const questionTemplates = {
      bu: {
        name: "What would you like to name this Business Unit?",
        description: collectedName 
          ? `Great! Now I need a description for "${collectedName}". You can provide one or just say "auto" for me to generate it.`
          : "Please provide a description for this Business Unit, or say 'auto' for auto-generation.",
        code: collectedName
          ? `Perfect! I'll auto-generate a code for "${collectedName}". Just say "auto" or provide your own code.`
          : "What code should I use for this Business Unit? Say 'auto' for auto-generation.",
        displayName: collectedName
          ? `I'll use "${collectedName}" as the display name. Just say "yes" to confirm or provide a different display name.`
          : "What display name should I use for this Business Unit?",
        startDate: "What's the start date? You can say 'today' for current date or provide a date (YYYY-MM-DD)."
      },
      lob: {
        name: "What would you like to name this Line of Business?",
        description: collectedName 
          ? `Excellent! Now I need a description for "${collectedName}". Provide one or say "auto" for auto-generation.`
          : "Please provide a description for this Line of Business, or say 'auto' for auto-generation.",
        code: collectedName
          ? `Great! I'll auto-generate a code for "${collectedName}". Say "auto" to proceed or provide your own.`
          : "What code should I use? Say 'auto' for auto-generation.",
        businessUnitId: availableBusinessUnits && availableBusinessUnits.length > 0
          ? `Which Business Unit should "${collectedName || 'this LOB'}" belong to?\n${availableBusinessUnits.map((bu, i) => `${i + 1}. ${bu.name}`).join('\n')}\n\nJust type the number (e.g., "1") to select.`
          : "I need a Business Unit for this LOB. Please create a Business Unit first.",
        startDate: "What's the start date? Say 'today' for current date or provide a date (YYYY-MM-DD)."
      }
    };

    const entityType = intent === 'create_bu' ? 'bu' : 'lob';
    const templates = questionTemplates[entityType];
    
    return templates[nextField as keyof typeof templates] || `Please provide the ${nextField}.`;
  }

  private extractEntities(message: string): ChatEntity[] {
    const entities: ChatEntity[] = [];
    
    // Extract potential names (quoted strings or capitalized words)
    const nameMatches = message.match(/"([^"]+)"|'([^']+)'|([A-Z][a-zA-Z\s]+)/g);
    if (nameMatches) {
      nameMatches.forEach(match => {
        const cleanMatch = match.replace(/['"]/g, '').trim();
        if (cleanMatch.length > 1) {
          entities.push({
            type: 'bu_name', // Could be bu_name or lob_name
            value: cleanMatch,
            confidence: 0.8
          });
        }
      });
    }

    // Extract codes (uppercase with underscores/numbers)
    const codeMatches = message.match(/\b[A-Z][A-Z0-9_]+\b/g);
    if (codeMatches) {
      codeMatches.forEach(match => {
        entities.push({
          type: 'code',
          value: match,
          confidence: 0.9
        });
      });
    }

    // Extract dates
    const dateMatches = message.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/g);
    if (dateMatches) {
      dateMatches.forEach(match => {
        entities.push({
          type: 'date',
          value: match,
          confidence: 0.9
        });
      });
    }

    return entities;
  }

  private extractParameters(message: string, intent: string): Record<string, any> {
    const parameters: Record<string, any> = {};
    
    // Extract name from common patterns
    const namePatterns = [
      /(?:name|call|named)\s+(?:it\s+)?["']?([^"']+)["']?/i,
      /["']([^"']+)["']/,
      /create.*["']([^"']+)["']/i
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        parameters.name = match[1].trim();
        break;
      }
    }

    // Extract description
    const descriptionPatterns = [
      /description\s+(?:is\s+)?["']?([^"']+)["']?/i,
      /for\s+([^,]+)/i
    ];

    for (const pattern of descriptionPatterns) {
      const match = message.match(pattern);
      if (match && match[1] && !parameters.name) {
        parameters.description = match[1].trim();
        break;
      }
    }

    return parameters;
  }

  private processConversationResponse(message: string, sessionId: string): ChatCommand {
    const state = this.conversationStates.get(sessionId);
    if (!state) {
      return {
        intent: 'unknown',
        confidence: 0.1,
        entities: [],
        parameters: {},
        requiresFollowup: false
      };
    }

    const nextField = state.missingFields[0];
    let extractedValue: any = message.trim();

    // Process based on field name
    switch (nextField) {
      case 'startDate':
        // Handle "today" or "now" responses
        if (message.toLowerCase().match(/^(today|now|current)$/)) {
          extractedValue = new Date();
        } else {
          // Try to parse date
          const dateMatch = message.match(/\d{4}-\d{2}-\d{2}/);
          if (dateMatch) {
            extractedValue = new Date(dateMatch[0]);
          } else {
            // Try other date formats or use current date as default
            const date = new Date(message);
            if (!isNaN(date.getTime())) {
              extractedValue = date;
            } else {
              // Default to current date if parsing fails
              extractedValue = new Date();
            }
          }
        }
        break;
      
      case 'businessUnitId':
        // Try to match by number or name
        const numberMatch = message.match(/^\d+/);
        if (numberMatch) {
          extractedValue = `option_${numberMatch[0]}`;
        }
        break;
      
      case 'code':
        // Handle "auto" response or auto-generate from name
        if (message.toLowerCase().match(/^(auto|generate|default)$/) || state.collectedData.name) {
          extractedValue = this.generateCodeFromName(state.collectedData.name as string, state.currentIntent);
        } else {
          extractedValue = message.toUpperCase().replace(/\s+/g, '_');
        }
        break;
        
      case 'displayName':
        // Use name as display name if not provided differently
        if (state.collectedData.name) {
          extractedValue = state.collectedData.name;
        } else {
          extractedValue = message.trim();
        }
        break;
        
      case 'description':
        // If user just says "yes" or similar, auto-generate description
        if (message.toLowerCase().match(/^(yes|ok|sure|default|auto)$/)) {
          if (state.collectedData.name) {
            const entityType = state.currentIntent === 'create_bu' ? 'Business Unit' : 'Line of Business';
            extractedValue = `${state.collectedData.name} - ${entityType} for forecasting and analysis`;
          } else {
            extractedValue = "Auto-generated description for forecasting and analysis";
          }
        } else {
          extractedValue = message.trim();
        }
        break;
    }

    // Update the conversation state immediately
    this.updateConversation(sessionId, nextField, extractedValue);

    const updatedState = this.conversationStates.get(sessionId);
    const stillNeedsInfo = updatedState ? updatedState.missingFields.length > 0 : false;

    return {
      intent: 'provide_info',
      confidence: 0.9,
      entities: [{
        type: nextField as any,
        value: extractedValue,
        confidence: 0.9
      }],
      parameters: { [nextField]: extractedValue },
      requiresFollowup: stillNeedsInfo,
      nextStep: stillNeedsInfo ? 'collect_next_field' : 'complete_creation'
    };
  }

  private generateCodeFromName(name: string, intent?: string): string {
    const prefix = intent === 'create_bu' ? 'BU' : 'LOB';
    const cleanName = name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 10);
    const timestamp = Date.now().toString().slice(-3);
    return `${prefix}_${cleanName}_${timestamp}`;
  }

  private requiresFollowup(intent: string, entities: ChatEntity[]): boolean {
    const requiredFields = this.getRequiredFields(intent);
    const providedFields = entities.map(e => this.mapEntityToField(e.type));
    const missingFields = requiredFields.filter(field => !providedFields.includes(field));
    
    return missingFields.length > 0;
  }

  private getNextStep(intent: string, entities: ChatEntity[]): string {
    if (this.requiresFollowup(intent, entities)) {
      return 'collect_missing_fields';
    }
    return 'execute_creation';
  }

  private getRequiredFields(intent: string): string[] {
    switch (intent) {
      case 'create_bu':
        return ['name', 'description', 'code', 'displayName', 'startDate'];
      case 'create_lob':
        return ['name', 'description', 'code', 'businessUnitId', 'startDate'];
      default:
        return [];
    }
  }

  private getMaxSteps(intent: string): number {
    return this.getRequiredFields(intent).length;
  }

  private mapEntityToField(entityType: string): string {
    const mapping: Record<string, string> = {
      'bu_name': 'name',
      'lob_name': 'name',
      'description': 'description',
      'code': 'code',
      'date': 'startDate',
      'business_unit': 'businessUnitId'
    };
    
    return mapping[entityType] || entityType;
  }
}

// Export singleton instance
export const chatCommandProcessor = new ChatCommandProcessor();