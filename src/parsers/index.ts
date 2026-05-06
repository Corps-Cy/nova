import fs from 'fs';
import path from 'path';

/**
 * Parse a text/markdown file into chunks.
 */
export function parseTextFile(filePath: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return splitText(content, chunkSize, overlap);
}

/**
 * Parse a PDF file into text chunks.
 */
export async function parsePdfFile(filePath: string, chunkSize: number = 500, overlap: number = 50): Promise<string[]> {
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return splitText(data.text, chunkSize, overlap);
}

/**
 * Fetch a URL and parse its text content.
 */
export async function parseUrl(url: string, chunkSize: number = 500, overlap: number = 50): Promise<string[]> {
  const cheerio = await import('cheerio');
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove scripts, styles, nav, footer
  $('script, style, nav, footer, header, iframe').remove();
  const text = $('body').text().replace(/\s+/g, ' ').trim();
  return splitText(text, chunkSize, overlap);
}

/**
 * Parse raw text content (from string).
 */
export function parseText(content: string, chunkSize: number = 500, overlap: number = 50): string[] {
  return splitText(content, chunkSize, overlap);
}

/**
 * Split text into overlapping chunks, respecting paragraph boundaries.
 */
function splitText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  let buffer = '';

  for (const para of paragraphs) {
    if ((buffer + '\n\n' + para).length > chunkSize && buffer.length > 0) {
      chunks.push(buffer.trim());
      // Keep overlap from end of buffer
      const words = buffer.split(' ');
      const overlapWords = words.slice(-Math.ceil(overlap / 2));
      buffer = overlapWords.join(' ') + ' ' + para;
    } else {
      buffer = buffer ? buffer + '\n\n' + para : para;
    }
  }

  if (buffer.trim()) chunks.push(buffer.trim());

  // Handle very long paragraphs that exceed chunk size
  const finalChunks: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length <= chunkSize * 1.5) {
      finalChunks.push(chunk);
    } else {
      // Split by sentences
      const sentences = chunk.split(/(?<=[.!?。！？])\s+/);
      let sub = '';
      for (const s of sentences) {
        if ((sub + ' ' + s).length > chunkSize && sub.length > 0) {
          finalChunks.push(sub.trim());
          sub = s;
        } else {
          sub = sub ? sub + ' ' + s : s;
        }
      }
      if (sub.trim()) finalChunks.push(sub.trim());
    }
  }

  return finalChunks.filter(c => c.trim().length > 10);
}

export function getParser(filename: string): 'text' | 'pdf' {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  return 'text'; // txt, md, csv, json, html, etc.
}
