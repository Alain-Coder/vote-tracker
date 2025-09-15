import { NextResponse } from 'next/server'
import { getDistricts } from '@/lib/firebase-service'

export async function GET() {
  try {
    console.log('Testing Firestore connection...')
    const districts = await getDistricts()
    console.log(`Found ${districts.length} districts`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Firestore is working!', 
      districtCount: districts.length 
    })
  } catch (error) {
    console.error('Firestore test failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}