const CDN = 'https://images.unsplash.com/photo-'

function photo(id, width = 1600, quality = 70) {
  return `${CDN}${id}?auto=format&fit=crop&w=${width}&q=${quality}`
}

export const IMAGES = {
  heroRider: photo('1617347454431-f49d7ff5c3b1', 1800),
  riderOnRoad: photo('1607130232670-52123ba5be5c', 1400),
  parcelHandoff: photo('1566576721346-d4a3b4eaeb55', 1200),
  sortingFacility: photo('1580674285054-bed31e145f59', 1200),
  parcelStack: photo('1543499459-d1460946bdc6', 1000),
  deliveryVan: photo('1620455800201-7f00aeef12ed', 1200),
  boxesOnDoorstep: photo('1604605801370-3396f9bd9cf0', 1000),
  teamPlanning: photo('1493135637657-c2411b3497ad', 1200),
  riderPortrait: photo('1612006567758-1846b36dd130', 1000),
  scanningParcel: photo('1607273685680-6bd976c5a5ce', 1000),
  nairobiStreet: photo('1611348524140-53c9a25263d6', 1600),
  nairobiSkyline: photo('1596005554384-d293674c91d7', 1600),
}

export const CREDIT = 'Photography from Unsplash'
