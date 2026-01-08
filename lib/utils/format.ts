export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  // Handle edge case where log calculation results in negative index for values < 1
  // or out of bounds for very large values
  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)))
  
  // Fallback if index is still out of bounds
  if (i >= sizes.length) return `${bytes} Bytes`
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
