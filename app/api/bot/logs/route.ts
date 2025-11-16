// Gerçek zamanlı log akışı (Server-Sent Events)

import { NextRequest, NextResponse } from 'next/server';
import { getLogs, clearLogs } from '@/lib/bot/logger';

export async function GET(request: NextRequest) {
  // Server-Sent Events setup
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // İlk logları gönder
      const initialLogs = getLogs();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialLogs)}\n\n`)
      );

      // Her 1 saniyede bir yeni logları kontrol et
      const interval = setInterval(() => {
        const logs = getLogs();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(logs)}\n\n`));
      }, 1000);

      // Cleanup
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// DELETE /api/bot/logs - Logları temizle
export async function DELETE() {
  clearLogs();
  return NextResponse.json({ success: true, message: 'Loglar temizlendi' });
}
