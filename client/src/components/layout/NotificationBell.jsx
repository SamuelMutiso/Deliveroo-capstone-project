import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'

import Spinner from '@/components/ui/Spinner'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  selectNotifications,
  selectNotificationsError,
  selectNotificationsStatus,
  selectUnreadCount,
} from '@/features/notifications/notificationsSlice'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'
import { relativeTime } from '@/utils/formatters'

const ORDER_PATH_BY_ROLE = {
  [ROLES.CUSTOMER]: (id) => `/orders/${id}`,
  [ROLES.COURIER]: (id) => `/courier/${id}`,
  [ROLES.ADMIN]: (id) => `/admin/orders/${id}`,
}

export default function NotificationBell() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { role } = useAuth()

  const items = useSelector(selectNotifications)
  const unread = useSelector(selectUnreadCount)
  const status = useSelector(selectNotificationsStatus)
  const error = useSelector(selectNotificationsError)

  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    dispatch(fetchUnreadCount())
  }, [dispatch])

  useEffect(() => {
    if (open) dispatch(fetchNotifications())
  }, [dispatch, open])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const openNotification = (notification) => {
    if (!notification.is_read) dispatch(markNotificationRead(notification.id))
    setOpen(false)

    const toPath = ORDER_PATH_BY_ROLE[role]
    if (notification.order_id && toPath) navigate(toPath(notification.order_id))
  }

  const badge = unread > 9 ? '9+' : String(unread)

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-body text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="fixed inset-x-3 top-[4.5rem] z-[60] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-display text-sm font-bold text-slate-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => dispatch(markAllNotificationsRead())}
                className="font-body text-xs font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {status === 'loading' && !items.length ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : error ? (
              <p className="px-4 py-8 text-center font-body text-sm text-red-700">{error}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center font-body text-sm text-slate-500">
                Nothing yet. Updates about your deliveries will show up here.
              </p>
            ) : (
              <ul>
                {items.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className={[
                        'flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50',
                        notification.is_read ? 'bg-white' : 'bg-brand-50/60',
                      ].join(' ')}
                    >
                      <span
                        className={[
                          'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                          notification.is_read ? 'bg-transparent' : 'bg-brand-500',
                        ].join(' ')}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="block font-body text-sm font-semibold text-slate-900">
                          {notification.title}
                        </span>
                        <span className="mt-0.5 block font-body text-xs leading-relaxed text-slate-600">
                          {notification.body}
                        </span>
                        <span className="mt-1 block font-body text-xs text-slate-400">
                          {notification.tracking_code
                            ? `${notification.tracking_code} · ${relativeTime(notification.created_at)}`
                            : relativeTime(notification.created_at)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
