import React from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon } from 'react-basics';
import styles from './MobileMenu.module.css';

export function MobileMenu({
  items = [],
  onClose,
}: {
  items: any[];
  className?: string;
  onClose: () => void;
}): any {
  const pathname = usePathname();

  const Items = ({ items, className }: { items: any[]; className?: string }): any => (
    <div className={classNames(styles.items, className)}>
      {items.map(
        ({
          label,
          url,
          children,
          icon,
        }: {
          label: string;
          url: string;
          children: any[];
          icon?: any;
        }) => {
          const selected = pathname.startsWith(url);

          return (
            <React.Fragment key={url}>
              <Link
                href={url}
                className={classNames(styles.item, { [styles.selected]: selected })}
                onClick={onClose}
              >
                {icon && <Icon size="md">{icon}</Icon>}
                {label}
              </Link>
              {children && <Items items={children} className={styles.submenu} />}
            </React.Fragment>
          );
        },
      )}
    </div>
  );

  return createPortal(
    <div className={classNames(styles.menu)}>
      <Items items={items} />
    </div>,
    document.body,
  );
}

export default MobileMenu;
