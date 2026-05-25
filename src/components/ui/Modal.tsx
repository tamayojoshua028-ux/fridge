import React, { useEffect } from 'react'
import styles from './Modal.module.css'
import { Button } from './index'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: number
}

export const Modal: React.FC<ModalProps> = ({ title, onClose, children, maxWidth = 520 }) => {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} style={{ maxWidth }}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>✕</Button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
