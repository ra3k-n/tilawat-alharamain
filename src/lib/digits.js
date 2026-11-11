const AR = '٠١٢٣٤٥٦٧٨٩'
export const toAr = (v) => String(v).replace(/\d/g, (d) => AR[d])
export const pad2 = (n) => String(n).padStart(2, '0')
