import React from 'react'

import type { PageId } from '@/types'
import { NAV_ITEMS } from '@/lib/constants/app'
import { Avatar, Badge } from '@/components/ui'
import styles from './Sidebar.module.css'

interface SidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
  badgeCounts?: Partial<Record<PageId, number>>
  user?: {
    name: string
    avatarInitials: string
    plan: 'free' | 'premium'
  }
}

const MAIN_NAV = NAV_ITEMS.slice(0, 6)
const ACCT_NAV = NAV_ITEMS.slice(6)

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, badgeCounts = {}, user }) => (
  <aside className={styles.sidebar}>
    <div className={styles.logo}>
      <div className={styles.logoMark}>🥗</div>
      <div className={styles.logoText}>FreshTrack</div>
      <div className={styles.logoSub}>Kitchen Intelligence</div>
    </div>

    <nav className={styles.navSection}>
      <div className={styles.navLabel}>Main</div>
      {MAIN_NAV.map((item) => (
        <button
          key={item.id}
          className={[styles.navItem, activePage === item.id ? styles.navItem_active : ''].join(' ')}
          onClick={() => onNavigate(item.id)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span className={styles.navLabel2}>{item.label}</span>
          {(badgeCounts[item.id] ?? 0) > 0 && (
            <Badge count={badgeCounts[item.id] ?? 0} color={item.id === 'notifications' ? 'red' : 'green'} />
          )}
        </button>
      ))}
    </nav>

    <nav className={styles.navSection}>
      <div className={styles.navLabel}>Account</div>
      {ACCT_NAV.map((item) => (
        <button
          key={item.id}
          className={[styles.navItem, activePage === item.id ? styles.navItem_active : ''].join(' ')}
          onClick={() => onNavigate(item.id)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span className={styles.navLabel2}>{item.label}</span>
          {(badgeCounts[item.id] ?? 0) > 0 && (
            <Badge count={badgeCounts[item.id] ?? 0} color={item.id === 'notifications' ? 'red' : 'green'} />
          )}
        </button>
      ))}
    </nav>

    {user && (
      <div className={styles.bottom}>
        <div className={styles.userCard} onClick={() => onNavigate('profile')}>
          <Avatar initials={user.avatarInitials} size="md" />
          <div>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userPlan}>✨ {user.plan === 'premium' ? 'Premium' : 'Free'}</div>
          </div>
        </div>
      </div>
    )}
  </aside>
)
