import { IAgentRuntime, Memory, Provider, State, elizaLogger } from '@elizaos/core';
import * as fs from 'fs';
import * as path from 'path';

export const firecrawlResearchProvider: Provider = {
  get: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<Error | string> => {
    try {
      // Get the character metadata to find the path to the research file
      const character = runtime.character;
      // Access metadata using any type to bypass type checking
      const firecrawlPath = (character as any)?.metadata?.firecrawl_research_path;
      
      if (!firecrawlPath) {
        return 'No firecrawl_research_path found in character metadata.';
      }

      // Resolve the path to the research file
      const researchPath = path.resolve(process.cwd(), firecrawlPath);
      
      // Check if the file exists
      if (!fs.existsSync(researchPath)) {
        elizaLogger.error(`Firecrawl research file not found at: ${researchPath}`);
        return `Research file not found at: ${researchPath}`;
      }

      // Read the research file
      const researchData = fs.readFileSync(researchPath, 'utf-8');
      const research = JSON.parse(researchData);
      console.log(research);
      // Process the research data to make it more useful for the agent
      const processedData = {
        timestamp: research.metadata.timestamp,
        topics: research.data.map(item => ({
          topic: item.query,
          summary: item.finalAnalysis,
        })),
      };

      console.log(`Successfully loaded firecrawl research data with ${processedData.topics.length} topics`);
      return JSON.stringify(processedData, null, 2);
    } catch (error) {
      console.log(`Error accessing firecrawl research: ${error.message}`);
      return error instanceof Error ? error.message : 'Unable to get firecrawl research data';
    }
  },
}; 