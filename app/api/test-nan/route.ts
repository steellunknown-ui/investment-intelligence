import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
    return NextResponse.json({ 
        num: NaN, 
        inf: Infinity, 
        str: "NaN", 
        sumNaN: 0 + NaN 
    })
}
