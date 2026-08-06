const CART_KEY = 'balconyhouse:cart'

const emptyCart = () => ({ checkIn: '', checkOut: '', notes: '', rooms: [] })

export function getCart() {
  try {
    const raw = sessionStorage.getItem(CART_KEY)
    return raw ? { ...emptyCart(), ...JSON.parse(raw) } : emptyCart()
  } catch {
    return emptyCart()
  }
}

export function setCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart))
  return cart
}

export function setDates(checkIn, checkOut) {
  return setCart({ ...getCart(), checkIn, checkOut })
}

export function setNotes(notes) {
  return setCart({ ...getCart(), notes })
}

// { propertyId, propertyName, propertyHeroImageUrl, guests }
export function addRoom(room) {
  const cart = getCart()
  const rooms = cart.rooms.filter((r) => r.propertyId !== room.propertyId)
  rooms.push(room)
  return setCart({ ...cart, rooms })
}

export function removeRoom(propertyId) {
  const cart = getCart()
  return setCart({ ...cart, rooms: cart.rooms.filter((r) => r.propertyId !== propertyId) })
}

export function clearCart() {
  sessionStorage.removeItem(CART_KEY)
}
