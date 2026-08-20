const EDGE = 320
const QUALITY = 0.82
const MAX_INPUT_BYTES = 8 * 1024 * 1024

export function squarePhotoDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Choose an image file'))
      return
    }
    if (file.size > MAX_INPUT_BYTES) {
      reject(new Error('That image is larger than 8MB'))
      return
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('That file is not a readable image'))
      image.onload = () => {
        const edge = Math.min(image.width, image.height)
        const canvas = document.createElement('canvas')
        canvas.width = EDGE
        canvas.height = EDGE
        canvas
          .getContext('2d')
          .drawImage(
            image,
            (image.width - edge) / 2,
            (image.height - edge) / 2,
            edge,
            edge,
            0,
            0,
            EDGE,
            EDGE,
          )
        resolve(canvas.toDataURL('image/jpeg', QUALITY))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
