#!/usr/bin/env node
import { ApiKeyService } from '../services/api-key.service';

const apiKeyService = new ApiKeyService();
const { apiKey, projectId } = apiKeyService.generateApiKey();

console.log('\n🔑 Your AuthFlow API Key:');
console.log('------------------------');
console.log(`API Key: ${apiKey}`);
console.log(`Project ID: ${projectId}`);
console.log('\n💡 Keep your API key secure! Add it to your .env file:');
console.log('AUTHFLOW_API_KEY=' + apiKey);
console.log('AUTHFLOW_PROJECT_ID=' + projectId);
console.log('\n🚀 Ready to use AuthFlow in your project!'); 