import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  const code = params.code;

  if (!code || code.length !== 11) {
    return NextResponse.json({ error: 'Invalid IFSC code format' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://ifsc.razorpay.com/${code.toUpperCase()}`);
    
    if (response.status === 404) {
      return NextResponse.json({ error: 'IFSC Code not found' }, { status: 404 });
    }

    if (!response.ok) {
        return NextResponse.json({ error: 'Failed to fetch from Razorpay' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API IFSC Proxy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
