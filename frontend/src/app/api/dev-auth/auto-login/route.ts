import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    success: true,
    token: 'mock-jwt-token-for-development',
    user: {
      id: 'mock-user-id',
      email: 'test@example.com',
      role: 'USER'
    }
  });
}