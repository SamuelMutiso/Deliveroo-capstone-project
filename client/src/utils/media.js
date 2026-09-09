const CDN = 'https://images.unsplash.com/photo-'

function photo(id, width = 1600, quality = 70) {
  return `${CDN}${id}?auto=format&fit=crop&w=${width}&q=${quality}`
}

export const IMAGES = {
  heroRider: photo('1707161304997-6d737698e089', 1800),   // rider on motorcycle — Nairobi, Kenya
  riderOnRoad: photo('1664181220731-06219378d8c7', 1400),  // busy traffic street — Nairobi, Kenya
  parcelHandoff: photo('1745410112776-cdbece87dc3c', 1200),// woman carrying bag on street — Nairobi, Kenya
  sortingFacility: photo('1580674285054-bed31e145f59', 1200),
  parcelStack: photo('1543499459-d1460946bdc6', 1000),
  deliveryVan: photo('1620455800201-7f00aeef12ed', 1200),
  boxesOnDoorstep: photo('1604605801370-3396f9bd9cf0', 1000),
  teamPlanning: photo('1493135637657-c2411b3497ad', 1200),
  riderPortrait: photo('1612006567758-1846b36dd130', 1000),
  scanningParcel: photo('1607273685680-6bd976c5a5ce', 1000),
  nairobiStreet: photo('1656068218535-85db26125e13', 1600), // pedestrians on street — Nairobi, Kenya
  nairobiSkyline: photo('1741991110666-88115e724741', 1600),// city skyline — Nairobi, Kenya
}

export const CREDIT = 'Photography from Unsplash'