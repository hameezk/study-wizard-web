import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import styles from './button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

interface Common {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: Common & ComponentProps<'button'>) {
  return (
    <button
      {...rest}
      className={cx(styles.base, styles[variant], size === 'lg' && styles.lg, className)}
    />
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  href,
  ...rest
}: Common & { href: string } & Omit<ComponentProps<typeof Link>, 'href'>) {
  // External links (the dashboard subdomain, the Chrome store) must be plain
  // anchors — Next's client router cannot navigate across origins.
  const external = /^https?:\/\//.test(href);
  const cls = cx(styles.base, styles[variant], size === 'lg' && styles.lg, className);

  if (external) {
    return <a {...(rest as ComponentProps<'a'>)} href={href} className={cls} />;
  }
  return <Link {...rest} href={href} className={cls} />;
}
