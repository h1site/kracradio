'use client';
import React from 'react';
import Link from 'next/link';

export default function ArticleCard({ article }) {
  const tr = article.article_translations?.[0];
  return (
    <Link href={`/article/${article.slug}`} className="card block overflow-hidden">
      {article.cover_url && (
        <img src={article.cover_url} alt={tr?.title} className="w-full h-48 object-cover" loading="lazy" />
      )}
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1">{tr?.title}</h3>
        <p className="text-sm opacity-80 line-clamp-2">{tr?.description}</p>
      </div>
    </Link>
  );
}
