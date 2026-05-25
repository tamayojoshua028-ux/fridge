import React, { Suspense, useEffect, useMemo } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import type { PageId } from '@/types'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastContainer } from '@/components/ui/Toast'
import { Badge } from '@/components/ui'
import { ErrorBoundary } from '@/components/app/ErrorBoundary'
import { useToast } from '@/hooks/useToast'
import { NAV_ITEMS, ROUTE_BY_PAGE } from '@/lib/constants/app'
import { isSupabaseConfigured } from '@/config/env'
import { useAuthStore } from '@/stores/authStore'
import { useDashboardStore } from '@/stores/dashboardStore'
import { useGroceryStore } from '@/stores/groceryStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { supabase } from '@/lib/supabase/client'
import styles from './App.module.css'

const AuthScreen = React.lazy(() =>
  import('@/features/auth/AuthScreen').then((module) => ({ default: module.AuthScreen })),
)
const AuthCallback = React.lazy(() =>
  import('@/features/auth/components/AuthCallback').then((module) => ({ default: module.AuthCallback })),
)
const ResetPasswordScreen = React.lazy(() =>
  import('@/features/auth/components/ResetPasswordScreen').then((module) => ({ default: module.ResetPasswordScreen })),
)
const Dashboard = React.lazy(() =>
  import('@/features/dashboard/Dashboard').then((module) => ({ default: module.Dashboard })),
)
const Inventory = React.lazy(() =>
  import('@/features/inventory/Inventory').then((module) => ({ default: module.Inventory })),
)
const Scanner = React.lazy(() =>
  import('@/features/scanner/Scanner').then((module) => ({ default: module.Scanner })),
)
const Recipes = React.lazy(() =>
  import('@/features/recipes/Recipes').then((module) => ({ default: module.Recipes })),
)
const GroceryList = React.lazy(() =>
  import('@/features/grocery/GroceryList').then((module) => ({ default: module.GroceryList })),
)
const Analytics = React.lazy(() =>
  import('@/features/analytics/Analytics').then((module) => ({ default: module.Analytics })),
)
const Notifications = React.lazy(() =>
  import('@/features/pages/Pages').then((module) => ({ default: module.Notifications })),
)
const Profile = React.lazy(() =>
  import('@/features/pages/Pages').then((module) => ({ default: module.Profile })),
)
const Settings = React.lazy(() =>
  import('@/features/pages/Pages').then((module) => ({ default: module.Settings })),
)

export default function App() {
  const initialize = useAuthStore((state) => state.initialize)
  const initialized = useAuthStore((state) => state.initialized)
  const loading = useAuthStore((state) => state.loading)

  useEffect(() => {
    void initialize()
  }, [initialize])

  if (!isSupabaseConfigured) {
    return <ConfigurationState />
  }

  if (!initialized || loading) {
    return <LoadingState />
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path="/auth" element={<PublicOnlyRoute><AuthScreen /></PublicOnlyRoute>} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/reset-password" element={<ResetPasswordScreen />} />
          <Route element={<ProtectedLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardRoute />} />
            <Route path="/inventory" element={<InventoryRoute />} />
            <Route path="/scanner" element={<ScannerRoute />} />
            <Route path="/recipes" element={<RecipesRoute />} />
            <Route path="/grocery" element={<GroceryRoute />} />
            <Route path="/analytics" element={<AnalyticsRoute />} />
            <Route path="/notifications" element={<NotificationsRoute />} />
            <Route path="/profile" element={<ProfileRoute />} />
            <Route path="/settings" element={<SettingsRoute />} />
          </Route>
          <Route path="*" element={<RouteFallback />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

function ProtectedLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = useAuthStore((state) => state.session)
  const profile = useAuthStore((state) => state.profile)
  const refreshProfile = useAuthStore((state) => state.refreshProfile)
  const inventorySummary = useInventoryStore((state) => state.summary)
  const fetchInventory = useInventoryStore((state) => state.fetchItems)
  const fetchCategories = useInventoryStore((state) => state.fetchCategories)
  const fetchGrocery = useGroceryStore((state) => state.fetchList)
  const fetchNotifications = useNotificationsStore((state) => state.fetchItems)
  const unreadCount = useNotificationsStore((state) => state.unreadCount)
  const fetchDashboard = useDashboardStore((state) => state.fetchSummary)
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    if (session && !profile) {
      void refreshProfile()
    }
  }, [profile, refreshProfile, session])

  useEffect(() => {
    if (!profile?.householdId) return

    void Promise.allSettled([
      fetchInventory(),
      fetchCategories(),
      fetchGrocery(),
      fetchNotifications(),
      fetchDashboard(),
    ])
  }, [fetchCategories, fetchDashboard, fetchGrocery, fetchInventory, fetchNotifications, profile?.householdId])

  useEffect(() => {
    if (!profile?.householdId) return

    const inventoryChannel = supabase
      .channel(`inventory-live:${profile.householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items', filter: `household_id=eq.${profile.householdId}` }, () => {
        void fetchInventory(true)
        void fetchDashboard()
      })
      .subscribe()

    const groceryChannel = supabase
      .channel(`grocery-live:${profile.householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items', filter: `household_id=eq.${profile.householdId}` }, () => {
        void fetchGrocery()
      })
      .subscribe()

    const notificationsChannel = supabase
      .channel(`notifications-live:${profile.householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `household_id=eq.${profile.householdId}` }, () => {
        void fetchNotifications()
      })
      .subscribe()

    const activityChannel = supabase
      .channel(`activity-live:${profile.householdId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'household_activity', filter: `household_id=eq.${profile.householdId}` }, () => {
        void fetchDashboard()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(inventoryChannel)
      void supabase.removeChannel(groceryChannel)
      void supabase.removeChannel(notificationsChannel)
      void supabase.removeChannel(activityChannel)
    }
  }, [fetchDashboard, fetchGrocery, fetchInventory, fetchNotifications, profile?.householdId])

  const activePage = getPageIdFromPath(location.pathname)
  const badgeCounts = useMemo(
    () => ({
      inventory: inventorySummary.expiring + inventorySummary.expired,
      notifications: unreadCount,
    }),
    [inventorySummary.expired, inventorySummary.expiring, unreadCount],
  )

  if (!session) {
    return <Navigate to="/auth" replace state={location.pathname} />
  }

  return (
    <div className={styles.app}>
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => navigate(ROUTE_BY_PAGE[page])}
        badgeCounts={badgeCounts}
        user={
          profile
            ? {
                name: profile.name,
                avatarInitials: profile.avatarInitials,
                plan: profile.plan,
              }
            : undefined
        }
      />

      <main className={styles.main}>
        <div className={styles.page}>
          <Outlet />
        </div>
      </main>

      <button
        className={styles.fab}
        onClick={() => navigate('/inventory?quickAdd=1')}
        aria-label="Quick add item"
      >
        +
      </button>

      <MobileNav activePage={activePage} badgeCounts={badgeCounts} onNavigate={(page) => navigate(ROUTE_BY_PAGE[page])} />
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}

function PublicOnlyRoute({ children }: { children: React.ReactElement }) {
  const session = useAuthStore((state) => state.session)
  return session ? <Navigate to="/dashboard" replace /> : children
}

function RouteFallback() {
  const session = useAuthStore((state) => state.session)
  return <Navigate to={session ? '/dashboard' : '/auth'} replace />
}

function DashboardRoute() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  return <Dashboard showToast={showToast} onNavigate={(page) => navigate(ROUTE_BY_PAGE[page])} />
}

function InventoryRoute() {
  const { showToast } = useToast()
  return <Inventory showToast={showToast} />
}

function ScannerRoute() {
  const { showToast } = useToast()
  return <Scanner showToast={showToast} />
}

function RecipesRoute() {
  const { showToast } = useToast()
  return <Recipes showToast={showToast} />
}

function GroceryRoute() {
  const { showToast } = useToast()
  return <GroceryList showToast={showToast} />
}

function AnalyticsRoute() {
  const { showToast } = useToast()
  return <Analytics showToast={showToast} />
}

function NotificationsRoute() {
  const { showToast } = useToast()
  return <Notifications showToast={showToast} />
}

function ProfileRoute() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  return <Profile showToast={showToast} onNavigate={(page) => navigate(ROUTE_BY_PAGE[page])} />
}

function SettingsRoute() {
  const { showToast } = useToast()
  return <Settings showToast={showToast} />
}

const MOBILE_NAV = NAV_ITEMS.slice(0, 5)

function MobileNav({
  activePage,
  badgeCounts,
  onNavigate,
}: {
  activePage: PageId
  badgeCounts: Partial<Record<PageId, number>>
  onNavigate: (page: PageId) => void
}) {
  return (
    <nav className={styles.mobileNav}>
      {MOBILE_NAV.map((item) => (
        <button
          key={item.id}
          className={[styles.mobileNavItem, activePage === item.id ? styles.mobileNavItem_active : ''].join(' ')}
          onClick={() => onNavigate(item.id)}
        >
          <span className={styles.mobileNavIcon}>{item.icon}</span>
          <span className={styles.mobileNavLabel}>{item.label}</span>
          {(badgeCounts[item.id] ?? 0) > 0 && (
            <span className={styles.mobileBadgeWrap}>
              <Badge count={badgeCounts[item.id] ?? 0} color={item.id === 'notifications' ? 'red' : 'green'} />
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}

function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🥗</div>
        <h1>Loading FreshTrack</h1>
        <p style={{ color: 'var(--text2)', marginTop: 8 }}>Restoring your kitchen workspace...</p>
      </div>
    </div>
  )
}

function ConfigurationState() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 520, background: 'var(--surface)', borderRadius: 24, boxShadow: 'var(--shadow-lg)', padding: 28 }}>
        <h1 style={{ marginBottom: 10 }}>Supabase configuration is missing</h1>
        <p style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
          Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_BASE_URL` to your environment before running the connected app.
        </p>
      </div>
    </div>
  )
}

function getPageIdFromPath(pathname: string): PageId {
  const segment = pathname.split('/')[1]
  if (!segment) return 'dashboard'
  return (NAV_ITEMS.find((item) => item.id === segment)?.id ?? 'dashboard') as PageId
}
