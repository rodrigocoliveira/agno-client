import type { CardGridComponentSpec } from '@rodrigocoliveira/agno-types';
import { Button } from '../../primitives/button';
import { cn } from '../../lib/cn';

export type CardGridProps = CardGridComponentSpec['props'];

export function CardGrid(props: CardGridProps) {
  const { cards, columns = { default: 1, md: 2, lg: 3 }, variant = 'default' } = props;

  if (!cards || cards.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 border rounded-md bg-muted/10">
        <p className="text-sm text-muted-foreground">No items available</p>
      </div>
    );
  }

  const gridCols = {
    default: columns.default || 1,
    sm: columns.sm,
    md: columns.md || 2,
    lg: columns.lg || 3,
    xl: columns.xl,
  };

  const gridClass = cn(
    'grid gap-4',
    gridCols.default === 1 ? 'grid-cols-1' : `grid-cols-${gridCols.default}`,
    gridCols.sm && `sm:grid-cols-${gridCols.sm}`,
    gridCols.md && `md:grid-cols-${gridCols.md}`,
    gridCols.lg && `lg:grid-cols-${gridCols.lg}`,
    gridCols.xl && `xl:grid-cols-${gridCols.xl}`,
  );

  const cardClass = cn(
    'rounded-lg border bg-card text-card-foreground shadow-sm',
    variant === 'bordered' && 'border-2',
    variant === 'elevated' && 'shadow-lg',
  );

  return (
    <div className={gridClass}>
      {cards.map((card) => (
        <div key={card.id} className={cardClass}>
          {card.image && (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
              <img
                src={card.image}
                alt={card.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-lg font-semibold leading-none tracking-tight">{card.title}</h3>
            {card.description && (
              <p className="text-sm text-muted-foreground">{card.description}</p>
            )}
          </div>
          {card.metadata && Object.keys(card.metadata).length > 0 && (
            <div className="px-6 pb-4">
              <dl className="space-y-1 text-sm">
                {Object.entries(card.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="text-muted-foreground">{key}:</dt>
                    <dd className="font-medium">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {card.actions && card.actions.length > 0 && (
            <div className="flex items-center gap-2 p-6 pt-0">
              {card.actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={() => {
                    if (action.onClick) {
                      window.dispatchEvent(
                        new CustomEvent('generative-ui-action', {
                          detail: { action: action.onClick, cardId: card.id },
                        }),
                      );
                    }
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
