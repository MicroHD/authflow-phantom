import { ApiKeyService } from '@auth-flow/phantom';

const apiKeyService = new ApiKeyService();
const { apiKey, projectId } = apiKeyService.generateApiKey();

console.log('Generated API Key:', apiKey);
console.log('Project ID:', projectId);
console.log('\nAdd these to your .env file:');
console.log(`AUTHFLOW_API_KEY=${apiKey}`);
console.log(`AUTHFLOW_PROJECT_ID=${projectId}`); 