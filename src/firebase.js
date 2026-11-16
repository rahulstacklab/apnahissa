import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import firebaseMessagingWorkerUrl from './firebase-messaging-sw.js?worker&url'
import { firebaseConfig } from './firebase-config.js'

export { firebaseConfig }

const requiredConfig = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
]
const missingConfig = requiredConfig.filter((key) => !import.meta.env[key])

if (missingConfig.length) {
  throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`)
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const analytics = isSupported().then((supported) =>
  supported ? getAnalytics(app) : null
)

export async function enablePushNotifications() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    throw new Error('Push notifications are not supported by this browser.')
  }
  if (!(await isSupported())) {
    throw new Error('Firebase push messaging is not supported by this browser.')
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    throw new Error('Missing Firebase web push certificate key configuration.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.')
  }

  const serviceWorkerRegistration = await navigator.serviceWorker.register(
    firebaseMessagingWorkerUrl,
    { type: 'module' }
  )
  const token = await getToken(getMessaging(app), {
    vapidKey,
    serviceWorkerRegistration,
  })

  if (!token) {
    throw new Error('Firebase did not return a push notification token.')
  }

  return token
}

export async function listenForPushMessages(callback) {
  if (!(await isSupported())) return () => {}
  return onMessage(getMessaging(app), callback)
}
