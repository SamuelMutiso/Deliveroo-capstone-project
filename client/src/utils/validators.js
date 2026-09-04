const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const KENYAN_PHONE = /^0[17]\d{8}$/
const PHONE_HINT = 'Enter a 10 digit number starting 07 or 01, for example 0712345678'

export function normalisePhone(raw) {
  const digits = (raw || '').replace(/[^\d+]/g, '')
  if (digits.startsWith('+254')) return `0${digits.slice(4)}`
  if (digits.startsWith('254')) return `0${digits.slice(3)}`
  if (/^[17]\d{8}$/.test(digits)) return `0${digits}`
  return digits
}

export function validateRegister(values) {
  const errors = {}
  if (!values.name || values.name.trim().length < 2) {
    errors.name = 'Tell us your full name'
  }
  if (!EMAIL_PATTERN.test(values.email || '')) {
    errors.email = 'Enter a valid email address'
  }
  if (values.phone && !validatePhone(values.phone)) {
    errors.phone = PHONE_HINT
  }
  if (!values.password || values.password.length < 8) {
    errors.password = 'Use at least 8 characters'
  }
  if (values.confirmPassword !== undefined && values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Both passwords must match'
  }
  return errors
}

export function validateLogin(values) {
  const errors = {}
  if (!EMAIL_PATTERN.test(values.email || '')) {
    errors.email = 'Enter a valid email address'
  }
  if (!values.password) {
    errors.password = 'Enter your password'
  }
  return errors
}

export function validateOrder(values) {
  const errors = {}
  if (!values.pickup?.address) errors.pickup = 'Choose a pickup point'
  if (!values.destination?.address) errors.destination = 'Choose a destination'
  if (
    values.pickup?.lat === values.destination?.lat &&
    values.pickup?.lng === values.destination?.lng &&
    values.pickup?.address
  ) {
    errors.destination = 'Pickup and destination cannot be the same place'
  }
  if (!values.weight_category) errors.weight_category = 'Pick a weight category'

  if (!values.recipient_name || values.recipient_name.trim().length < 2) {
    errors.recipient_name = 'Who is receiving the parcel?'
  }
  if (!validatePhone(values.recipient_phone)) {
    errors.recipient_phone = PHONE_HINT
  }
  if (values.recipient_email && !EMAIL_PATTERN.test(values.recipient_email)) {
    errors.recipient_email = 'Enter a valid email address, or leave it blank'
  }
  return errors
}

export function validatePhone(phone) {
  return KENYAN_PHONE.test(normalisePhone(phone))
}

export function isEmpty(errors) {
  return Object.keys(errors).length === 0
}
