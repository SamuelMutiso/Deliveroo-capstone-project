import axiosClient from './axiosClient'

export const notificationsApi = {
  list: (params = {}) =>
    axiosClient.get('/notifications', { params }).then((response) => response.data),
  unreadCount: () =>
    axiosClient.get('/notifications/unread-count').then((response) => response.data.unread),
  markRead: (id) =>
    axiosClient.patch(`/notifications/${id}/read`).then((response) => response.data.notification),
  markAllRead: () =>
    axiosClient.post('/notifications/read-all').then((response) => response.data.unread),
}
