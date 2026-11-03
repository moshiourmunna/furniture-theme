import { Plus } from 'lucide-react';
import type { Locale } from '@/lib/i18n';

export function Faqs({ locale, items }: { locale: Locale; items: { id?: number; questionEn: string; questionBn: string; answerEn: string; answerBn: string }[] }) {
  return (
    <div className="border-t border-line">
      {items.map((q, i) => (
        <details key={q.id ?? i} className="border-b border-line py-4 group/q" data-testid="faq-item">
          <summary className="flex justify-between gap-4 cursor-pointer list-none font-medium">{locale === 'bn' ? q.questionBn : q.questionEn}<Plus className="w-4 h-4 shrink-0 group-open/q:rotate-45 transition" /></summary>
          <p className="text-sm text-muted mt-3 leading-relaxed">{locale === 'bn' ? q.answerBn : q.answerEn}</p>
        </details>
      ))}
    </div>
  );
}

export const faqLd = (locale: Locale, faqs: { questionEn: string; questionBn: string; answerEn: string; answerBn: string }[]) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faqs.map((q) => ({ '@type': 'Question', name: locale === 'bn' ? q.questionBn : q.questionEn, acceptedAnswer: { '@type': 'Answer', text: locale === 'bn' ? q.answerBn : q.answerEn } })),
});
