import { NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const webhookUrl = process.env.SLACK_WEBHOOK_URL

    if (!webhookUrl) {
      console.error('SLACK_WEBHOOK_URL is not defined')
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      )
    }

    await axios.post(webhookUrl, {
      text: `*New User Feedback*\n\n${message}`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback submission failed:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
