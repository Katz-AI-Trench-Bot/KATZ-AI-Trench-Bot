export function validateConfig(config) {
  const requiredFields = [
    'botToken', 
    'openaiApiKey', 
    'smartContractAddress',
    'networks.ethereum.rpcUrl',
    'networks.base.rpcUrl'
  ];
  
  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], config);
    if (!value) {
      console.warn(`Warning: ${field} is not set in .env file`);
    }
  }
}