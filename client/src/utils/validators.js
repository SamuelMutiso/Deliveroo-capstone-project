const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const KENYAN_PHONE = /^(?:\+?254|0)?[17]\d{8}$/

export function validateRegister(values) {
  const errors = {}
  if (!values.name || values.name.trim().length < 2) {
    errors.name = 'Tell us your full name'
  }
  if (!EMAIL_PATTERN.test(values.email || '')) {
    errors.email = 'Enter a valid email address'
  }
  if (values.phone && !KENYAN_PHONE.test(values.phone.replace(/\s/g, ''))) {
    errors.phone = 'Enter a valid phone number, for example 0712345678'
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
  if (!KENYAN_PHONE.test((values.recipient_phone || '').replace(/\s/g, ''))) {
    errors.recipient_phone = 'Enter a valid phone number, for example 0712345678'
  }
  if (values.recipient_email && !EMAIL_PATTERN.test(values.recipient_email)) {
    errors.recipient_email = 'Enter a valid email address, or leave it blank'
  }
  return errors
}

export function validatePhone(phone) {
  return KENYAN_PHONE.test((phone || '').replace(/\s/g, ''))
}

export function isEmpty(errors) {
  return Object.keys(errors).length === 0
}
