import { NextResponse } from 'next/server';
import { prisma } from '@shekor/db';
import { api } from '@/server/route';
import { notFound } from '@/server/http';

/** Counts the download then redirects to the PDF. */
export const GET = api<{ slug: string }>(async (req, { params }) => {
  const c = await prisma.catalogue.findUnique({ where: { slug: (await params).slug } });
  if (!c || !c.isActive) throw notFound();
  await prisma.catalogue.update({ where: { id: c.id }, data: { downloads: { increment: 1 } } });
  return NextResponse.redirect(new URL(c.pdfUrl, req.url), 302);
});
