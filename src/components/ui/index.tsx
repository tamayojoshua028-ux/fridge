import React from 'react'
import styles from './ui.module.css'

// ─── Button ──────────────────────────────────────────────────────
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => (
  <button
    className={[styles.btn, styles[`btn_${variant}`], styles[`btn_${size}`], className].join(' ')}
    {...props}
  >
    {children}
  </button>
)

// ─── Tag ─────────────────────────────────────────────────────────
export type TagColor = 'green' | 'orange' | 'red' | 'blue' | 'purple' | 'gray'

interface TagProps {
  color?: TagColor
  children: React.ReactNode
  className?: string
}

export const Tag: React.FC<TagProps> = ({ color = 'gray', children, className = '' }) => (
  <span className={[styles.tag, styles[`tag_${color}`], className].join(' ')}>
    {children}
  </span>
)

// ─── Card ─────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'md',
}) => (
  <div
    className={[
      styles.card,
      hoverable ? styles.card_hoverable : '',
      styles[`card_pad_${padding}`],
      className,
    ].join(' ')}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    {children}
  </div>
)

// ─── Avatar ──────────────────────────────────────────────────────
interface AvatarProps {
  initials: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Avatar: React.FC<AvatarProps> = ({ initials, size = 'md' }) => (
  <div className={[styles.avatar, styles[`avatar_${size}`]].join(' ')}>
    {initials}
  </div>
)

// ─── Badge ───────────────────────────────────────────────────────
interface BadgeProps {
  count: number
  color?: 'green' | 'red'
}

export const Badge: React.FC<BadgeProps> = ({ count, color = 'green' }) => (
  <span className={[styles.badge, styles[`badge_${color}`]].join(' ')}>{count}</span>
)

// ─── ProgressBar ─────────────────────────────────────────────────
interface ProgressBarProps {
  value: number          // 0-100
  color?: string
  height?: number
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'var(--em)',
  height = 8,
}) => (
  <div className={styles.progressTrack} style={{ height }}>
    <div
      className={styles.progressFill}
      style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, height }}
    />
  </div>
)

// ─── ExpiryBar ───────────────────────────────────────────────────
interface ExpiryBarProps {
  expDate: string
  status: 'fresh' | 'expiring' | 'expired'
}

const STATUS_COLORS = { fresh: 'var(--em)', expiring: 'var(--orange)', expired: 'var(--red)' }

export const ExpiryBar: React.FC<ExpiryBarProps> = ({ expDate, status }) => {
  const pct = Math.max(
    0,
    Math.min(100, ((new Date(expDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)) * 100)
  )
  return <ProgressBar value={pct} color={STATUS_COLORS[status]} height={4} />
}

// ─── Toggle ──────────────────────────────────────────────────────
interface ToggleProps {
  on: boolean
  onChange: () => void
}

export const Toggle: React.FC<ToggleProps> = ({ on, onChange }) => (
  <div
    className={[styles.toggle, on ? styles.toggle_on : ''].join(' ')}
    onClick={onChange}
    role="switch"
    aria-checked={on}
    tabIndex={0}
    onKeyDown={e => e.key === ' ' && onChange()}
  />
)

// ─── Skeleton ────────────────────────────────────────────────────
interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, className = '' }) => (
  <div
    className={['skeleton', className].join(' ')}
    style={{ width, height, borderRadius: 8 }}
  />
)

// ─── EmptyState ──────────────────────────────────────────────────
interface EmptyStateProps {
  emoji: string
  title: string
  description?: string
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({ emoji, title, description, action }) => (
  <div className={styles.emptyState}>
    <div className={styles.emptyEmoji}>{emoji}</div>
    <h3 className={styles.emptyTitle}>{title}</h3>
    {description && <p className={styles.emptyDesc}>{description}</p>}
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
)

// ─── SearchBar ───────────────────────────────────────────────────
interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => (
  <div className={[styles.searchBar, className].join(' ')}>
    <span className={styles.searchIcon}>🔍</span>
    <input
      className={styles.searchInput}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
    />
    {value && (
      <button className={styles.searchClear} onClick={() => onChange('')}>✕</button>
    )}
  </div>
)

// ─── TabBar ──────────────────────────────────────────────────────
interface Tab {
  id: string
  label: string
}

interface TabBarProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, active, onChange }) => (
  <div className={styles.tabBar}>
    {tabs.map(t => (
      <button
        key={t.id}
        className={[styles.tab, active === t.id ? styles.tab_active : ''].join(' ')}
        onClick={() => onChange(t.id)}
      >
        {t.label}
      </button>
    ))}
  </div>
)

// ─── SectionHeader ───────────────────────────────────────────────
interface SectionHeaderProps {
  title: string
  action?: React.ReactNode
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => (
  <div className={styles.sectionHeader}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    {action}
  </div>
)

// ─── Input ───────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, className = '', ...props }, ref) => (
  <div className={styles.formGroup}>
    {label && <label className={styles.formLabel}>{label}</label>}
    <input ref={ref} className={['input', className].join(' ')} {...props} />
  </div>
))

Input.displayName = 'Input'

// ─── Select ──────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ label, options, className = '', ...props }, ref) => (
  <div className={styles.formGroup}>
    {label && <label className={styles.formLabel}>{label}</label>}
    <select ref={ref} className={['input', 'select', className].join(' ')} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
))

Select.displayName = 'Select'
