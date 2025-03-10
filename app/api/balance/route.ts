import { NextRequest } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BALANCE_URL = 'https://api.deepseek.com/user/balance';

export async function GET(req: NextRequest) {
  if (!DEEPSEEK_API_KEY) {
    return Response.json(
      { error: 'Deepseek API key not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(DEEPSEEK_BALANCE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
    });

    if (response.status !== 200) {
      const error = await response.json();
      throw Error(JSON.stringify(error.error));
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Balance check error:', error);
    return Response.json(
      { 
        error: error instanceof Error ? JSON.parse(error.message) : 'Failed to fetch balance',
        canShowUser: true 
      },
      { status: 500 }
    );
  }
} 