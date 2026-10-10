import { NextRequest, NextResponse } from 'next/server';
import { PERSONA_IDS, loadPersona } from '@/lib/personas';
import { extractFeatures, matchToPersona } from '@/lib/stats/persona-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { avgLength, emojiRate, latinShare, bubblesPerTurn, laughterRate } = body;

    // Validate input
    if (
      typeof avgLength !== 'number' ||
      typeof emojiRate !== 'number' ||
      typeof latinShare !== 'number' ||
      typeof bubblesPerTurn !== 'number' ||
      typeof laughterRate !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Load all personas
    const personas = await Promise.all(PERSONA_IDS.map((id) => loadPersona(id)));

    // Extract feature vectors
    const featureVectors = personas.map((p) => extractFeatures(p.metadata.id, p.stats));

    // Match user profile
    const matches = matchToPersona(
      { avgLength, emojiRate, latinShare, bubblesPerTurn, laughterRate },
      featureVectors
    );

    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Match persona error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
