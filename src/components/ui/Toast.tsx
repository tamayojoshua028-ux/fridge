import React from 'react'
import type { ToastMessage } from '@/types'
import styles from './Toast.module.css'

interface ToastProps {
  toast: ToastMessage
  onClose: (id: string) => void
}

const ICONS: Record<NonNullable<ToastMessage['type']>, string> = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => (
  <div className={[styles.toast, styles[`toast_${toast.type ?? 'success'}`]].join(' ')}>
    <span>{ICONS[toast.type ?? 'success']}</span>
    <span className={styles.message}>{toast.message}</span>
    <button className={styles.close} onClick={() => onClose(toast.id)}>✕</button>
  </div>
)

export const ToastContainer: React.FC<{
  toasts: ToastMessage[]
  onClose: (id: string) => void
}> = ({ toasts, onClose }) => (
  <div className={styles.container}>
    {toasts.map(t => (
      <Toast key={t.id} toast={t} onClose={onClose} />
    ))}
  </div>
)
