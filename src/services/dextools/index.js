import { makeRequest } from './api.js';
import { formatTrendingToken, formatAnalysisMessage } from './formatters.js';
import { getNetworkSegment } from './utils.js';

export async function fetchTrendingTokens(network) {
  const networkSegment = getNetworkSegment(network);
  if (!networkSegment) {
    throw new Error(`Unsupported network: ${network}`);
  }

  try {
    const data = await makeRequest(`/ranking/${networkSegment}/hotpools`);
    
    if (!data?.data) {
      throw new Error('Invalid response from DexTools API');
    }

    return data.data
      .filter(token => token.mainToken && token.mainToken.address)
      .slice(0, 10)
      .map(formatTrendingToken(networkSegment));
  } catch (error) {
    console.error(`Error fetching trending tokens for ${network}:`, error);
    throw error;
  }
}

export async function getTokenInfo(network, tokenAddress) {
  const networkSegment = getNetworkSegment(network);
  try {
    const response = await makeRequest(`/token/${networkSegment}/${tokenAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching token info:', error);
    throw error;
  }
}

export async function getTokenPrice(network, tokenAddress) {
  const networkSegment = getNetworkSegment(network);
  try {
    // First get pool address
    const poolsResponse = await makeRequest(`/token/${networkSegment}/${tokenAddress}/pools`, {
      sort: 'creationTime',
      order: 'asc',
      from: '2022-10-01T00:00:00.000Z',
      to: new Date().toISOString()
    });

    if (!poolsResponse?.data?.results?.length) {
      throw new Error('No liquidity pools found');
    }

    const poolAddress = poolsResponse.data.results[0].address;
    const priceResponse = await makeRequest(`/pool/${networkSegment}/${poolAddress}/price`);
    return priceResponse.data?.price || 0;
  } catch (error) {
    console.error('Error fetching token price:', error);
    throw error;
  }
}

export async function formatTokenAnalysis(network, tokenAddress) {
  const networkSegment = getNetworkSegment(network);
  
  try {
    // First get pools data
    const poolsResponse = await makeRequest(`/token/${networkSegment}/${tokenAddress}/pools`, {
      sort: 'creationTime',
      order: 'asc',
      from: '2022-10-01T00:00:00.000Z',
      to: new Date().toISOString()
    });

    if (!poolsResponse?.data?.results?.length) {
      return 'No liquidity pools found for this token.';
    }

    const poolData = poolsResponse.data.results[0];
    const poolAddress = poolData.address;

    // Get token info
    const tokenInfo = await makeRequest(`/token/${networkSegment}/${tokenAddress}`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get token score
    const score = await makeRequest(`/token/${networkSegment}/${tokenAddress}/score`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get token audit
    const audit = await makeRequest(`/token/${networkSegment}/${tokenAddress}/audit`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get token price
    const price = await makeRequest(`/pool/${networkSegment}/${poolAddress}/price`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get pool liquidity
    const liquidity = await makeRequest(`/pool/${networkSegment}/${poolAddress}/liquidity`);

    return formatAnalysisMessage(
      tokenInfo?.data,
      score?.data,
      audit?.data,
      price?.data,
      liquidity?.data,
      poolData,
      networkSegment
    );
  } catch (error) {
    console.error('Error analyzing token:', error);
    throw error;
  }
}

export const dextools = {
  fetchTrendingTokens,
  formatTokenAnalysis,
  getTokenInfo,
  getTokenPrice
};