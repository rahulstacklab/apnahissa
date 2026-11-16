import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import { firebaseConfig } from './firebase-config.js'

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

onBackgroundMessage(messaging, (payload) => {
  const title = payload.notification?.title || payload.data?.title || 'ApnaHissa'
  const body = payload.notification?.body || payload.data?.body || ''

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    data: payload.data,
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const appClient = clients.find((client) => 'focus' in client)
      return appClient ? appClient.focus() : self.clients.openWindow('/')
    })
  )
})
