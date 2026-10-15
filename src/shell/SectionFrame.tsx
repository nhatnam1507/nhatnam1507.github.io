// Wraps a block's View: numbered sections get <section id class data-label>,
// strips render bare. Injects ctx.index from registry position.
import type { Block, PageContext } from './contract';

export function SectionFrame({
  block,
  index,
  page,
}: {
  block: Block;
  index: number;
  page: Omit<PageContext, 'index'>;
}) {
  const { View } = block;
  const ctx: PageContext = { ...page, index };
  if (block.kind !== 'section') return <View ctx={ctx} />;
  const cls = ['section', block.id, block.className].filter(Boolean).join(' ');
  return (
    <section id={block.id} className={cls} data-label={block.label}>
      <View ctx={ctx} />
    </section>
  );
}
